# Checking if using s3 bucket instead of memoryDB works.

POST http://localhost:8080/v1/fragments

# We're sending a plain text fragment
Content-Type: text/plain
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# Text Data
`Hello S3!`

# Expect 201
HTTP/1.1 201

# Capture the Location URL into a variable named `url`
[Captures]
url: header "Location"

# Try to GET the fragment we just posted by its URL
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
Content-Length: 9
[Asserts]
body == "Hello S3!"

# Deleting the fragment created
DELETE {{url}}
[BasicAuth]
user1@email.com:password1


HTTP/1.1 200

# Trying to get the fragment again after deleting
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404
