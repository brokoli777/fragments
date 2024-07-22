# Check if posting a fragment Content-Type that has a charset in content-type works, and is returned as the fragment's type when doing a GET

POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8

[BasicAuth]
user1@email.com:password1

`This is a fragment with charset!`

# We expect to get back an HTTP 201
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain; charset=utf-8"

[Captures]
url: header "Location"

# Try to GET the fragment we just posted by its URL
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
[Asserts]
body == "This is a fragment with charset!"
