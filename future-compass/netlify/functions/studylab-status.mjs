export default function handler(request) {
 if (request.method !== 'GET') return Response.json({error:'Method not allowed'},{status:405});
 return Response.json({ready:!!(process.env.OPENAI_API_KEY && process.env.STUDYLAB_ACCESS_CODE),protected:true},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
