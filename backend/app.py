import sys
import random
import time
from typing import Annotated
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from fastapi import FastAPI, Body, Request
from pydantic import BaseModel


"""
---------------------- PYTHON SERVER SETUP -----------------------
"""

app = FastAPI()
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)
IS_DEV = "app.py" in sys.argv[0]


@app.exception_handler(Exception)
async def unicorn_exception_handler(_: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": f"An error occurred: {exc}" if IS_DEV else "An error occurred!"},
        headers={"Access-Control-Allow-Origin": "*"}
    )


@app.get("/check_initialization")
async def check_initialization():
    # wait 2 seconds to simulate a slow initialization
    time.sleep(2)

    # app initialization validation here
    # ...

    # In case the validation fails, return "up": False and an error message to be shown in the frontend.
    return {
        "up": True,
        "error": None
    }


"""
--------------------------- REST CALLS -----------------------------
"""


@app.get("/get_example")
async def get_example():
    return random.randint(0, 100)


class InputBody(BaseModel):
    minimum: int
    maximum: int


@app.post("/post_example")
async def post_example(body: InputBody):
    return random.randint(body.minimum, body.maximum)


@app.post("/post_example_with_annotation")
async def post_example_with_annotation(minimum: Annotated[int, Body()], maximum: Annotated[int, Body()]):
    return random.randint(minimum, maximum)


@app.get("/error_example")
async def error_example():
    raise Exception("This is an example error!")


"""
-------------------------- APP SERVICES ----------------------------
"""


if __name__ == "__main__":
    uvicorn.run(app, port=int(sys.argv[1]), host="localhost")
