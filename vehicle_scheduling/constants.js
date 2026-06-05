//this folder is created to store all the constant values that are usually stored in .env, since .env should not be uploaded to github and security isn't priority in the assessment,i am putting them in this file.
const constants = {
  logServerURL: "http://4.224.186.231/evaluation-service/logs",
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJ2ZWxhZ2EubWloaXJAZ21haWwuY29tIiwiZXhwIjoxNzgwNjM5NjQ2LCJpYXQiOjE3ODA2Mzg3NDYsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiI0NzUyMmFmNi1iYjA5LTQ0N2QtYjFlMC0wMTE2N2JlNGE3OGIiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJtaWhpciB2ZWxhZ2EiLCJzdWIiOiJkNDgxMmY5NS1jNjFhLTQyZGUtYWY4NS05MDg5NTI4OTJlZGQifSwiZW1haWwiOiJ2ZWxhZ2EubWloaXJAZ21haWwuY29tIiwibmFtZSI6Im1paGlyIHZlbGFnYSIsInJvbGxObyI6IjIzYnExYTYxZTgiLCJhY2Nlc3NDb2RlIjoiUVFkRVl5IiwiY2xpZW50SUQiOiJkNDgxMmY5NS1jNjFhLTQyZGUtYWY4NS05MDg5NTI4OTJlZGQiLCJjbGllbnRTZWNyZXQiOiJNdFhGYUdSQ2twdEN2YnVTIn0.naXjIoajN8Nz6Jzn2TPjvtM0jzNgGoOPUK0JpfWkKxs",
  mechanicsFetchUrl: "http://4.224.186.213/evaluation-service/depots",
  vehiclesFetchUrl: "http://4.224.186.213/evaluation-service/vehicles",
};

module.exports = constants;
