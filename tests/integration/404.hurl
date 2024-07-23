#Check if invalid route returns 404 response
GET http://localhost:8080/no-such-route

#We should get a 404 response
HTTP/1.1 404
