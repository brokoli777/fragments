# We should get a 415 error for unsupported Content-Type

POST http://localhost:8080/v1/fragments
Content-Type: application/unsupported

[BasicAuth]
user1@email.com:password1

`This is an unsupported content type`

# We expect to get back an HTTP 415
HTTP/1.1 415
