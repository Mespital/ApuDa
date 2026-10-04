import importlib.util
import json
import os
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

TMP = tempfile.TemporaryDirectory()
os.environ['COMPASS_DATA'] = TMP.name
spec=importlib.util.spec_from_file_location('compass_auth',Path(__file__).with_name('server.py'))
s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)

class AuthenticationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        s.init()
        cls.http=s.ThreadingHTTPServer(('127.0.0.1',0),s.Handler)
        cls.url='http://127.0.0.1:'+str(cls.http.server_port)
        threading.Thread(target=cls.http.serve_forever,daemon=True).start()
    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown();cls.http.server_close();TMP.cleanup()
    def call(self,path,data=None,cookie='',origin=s.ORIGIN):
        headers={'Cookie':cookie}
        if data is not None:headers.update({'Content-Type':'application/json','Origin':origin})
        req=urllib.request.Request(self.url+path,data=json.dumps(data).encode() if data is not None else None,headers=headers)
        try:r=urllib.request.urlopen(req)
        except urllib.error.HTTPError as e:r=e
        return r.status,json.loads(r.read()),r.headers
    def login(self,role,password,remember=False):
        code,body,h=self.call('/api/auth/login',{'role':role,'password':password,'remember':remember})
        self.assertEqual(code,200,body)
        return h['Set-Cookie'].split(';')[0],h['Set-Cookie']
    def test_complete_owner_recovery_and_access_flow(self):
        self.assertEqual(self.call('/api/auth/status')[1]['configured'],False)
        self.assertEqual(self.call('/api/study')[0],401)
        self.assertEqual(self.call('/api/auth/login',{'role':'child','password':'0123'})[0],503)
        s.configure('0123','test-owner-password-2026')
        with self.assertRaises(ValueError):s.configure('9999','test-owner-password-2026')
        self.assertEqual(self.call('/api/auth/login',{'role':'child','password':'0123'},origin='https://evil.example')[0],403)
        child,cookie=self.login('child','0123',True)
        for flag in ['Secure','HttpOnly','SameSite=Strict','Max-Age=2592000']:self.assertIn(flag,cookie)
        self.assertEqual(self.call('/api/auth/status',cookie=child)[1]['role'],'child')
        self.assertEqual(self.call('/api/auth/admin/reset-pin',{'pin':'1111'},child)[0],403)
        payload={'core':{'tasks':[{'title':'보존할 공부 기록'}]},'extra':{}}
        self.assertEqual(self.call('/api/study',{'revision':0,'payload':payload},child)[0],200)
        self.assertEqual(self.call('/api/study',{'revision':0,'payload':payload},child)[0],409)
        parent,_=self.login('admin','test-owner-password-2026')
        self.assertEqual(self.call('/api/auth/admin/reset-pin',{'pin':'2468'},parent)[0],200)
        self.assertEqual(self.call('/api/study',cookie=child)[0],401)
        self.assertEqual(self.call('/api/auth/login',{'role':'child','password':'0123'})[0],401)
        child,_=self.login('child','2468')
        self.assertEqual(self.call('/api/study',cookie=child)[1]['payload'],payload)
        self.assertEqual(self.call('/api/auth/admin/lock',{},parent)[0],200)
        self.assertEqual(self.call('/api/study',cookie=child)[0],401)
        for _ in range(5):self.assertEqual(self.call('/api/auth/login',{'role':'child','password':'0000'})[0],401)
        s.init() # A restart must not clear the failed-attempt throttle.
        self.assertEqual(self.call('/api/auth/login',{'role':'child','password':'2468'})[0],429)
        self.assertEqual(self.call('/api/auth/admin/reset-pin',{'pin':'1357'},parent)[0],200)
        child,_=self.login('child','1357')
        self.assertEqual(self.call('/api/auth/admin/password',{'current':'test-owner-password-2026','password':'new-owner-password-2026'},parent)[0],200)
        self.assertEqual(self.call('/api/auth/admin',cookie=parent)[0],401)
        parent,_=self.login('admin','new-owner-password-2026')
        self.assertEqual(self.call('/api/auth/logout',{},child)[0],200)
        self.assertEqual(self.call('/api/study',cookie=child)[0],401)
        s.configure('9876','recovered-owner-password',replace=True)
        self.assertEqual(self.call('/api/auth/admin',cookie=parent)[0],401)
        child,_=self.login('child','9876')
        self.assertEqual(self.call('/api/study',cookie=child)[1]['payload'],payload)
        with s.db() as c:
            c.execute('UPDATE sessions SET expires=0')
            self.assertNotIn('9876',s.value(c,'child'))
        self.assertEqual(self.call('/api/study',cookie=child)[0],401)

if __name__=='__main__':unittest.main()
