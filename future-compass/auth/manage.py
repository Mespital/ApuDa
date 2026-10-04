"""Run only from the owner's SSH terminal. Credentials never appear in shell history."""
import getpass
import sys
from server import init, configure

if __name__ == '__main__':
    init()
    recovery = len(sys.argv)>1 and sys.argv[1]=='recover'
    print('보호자 계정 복구 (공부 기록 유지)' if recovery else '승준이 아지트 최초 설정')
    password = getpass.getpass('보호자 비밀번호 (12자 이상): ')
    if password != getpass.getpass('보호자 비밀번호 다시 입력: '):
        sys.exit('비밀번호가 달라요. 다시 실행해 주세요.')
    pin = getpass.getpass('승준이 PIN (숫자 4자리): ')
    if pin != getpass.getpass('승준이 PIN 다시 입력: '):
        sys.exit('PIN이 달라요. 다시 실행해 주세요.')
    try:
        configure(pin,password,replace=recovery)
    except ValueError as error:
        sys.exit(str(error))
    print('설정 완료. https://future.apuda.app/login.html 에서 로그인하세요.')
