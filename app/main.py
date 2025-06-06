"""This module contains the main FastAPI application."""

from contextlib import asynccontextmanager
from anyio import to_thread
from fastapi import Depends, FastAPI
from fastapi.responses import ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from app.common.security import login_for_access_token, get_current_user
from app.common.dependencies import get_db
from app.common import schemas

# Import your new modules’ routers
from app.user.apis import router as user_router
from app.project.apis import router as project_router
from app.location.apis import router as location_router
from app.location_task.apis import router as location_task_router
from app.monitoring_group.apis import router as monitoring_group_router
from app.monitoring_source.apis import router as monitoring_source_router
from app.monitoring_sensor.apis import router as monitoring_sensor_router
from app.monitoring_sensor_alert.apis import router as monitoring_sensor_alert_router
from app.monitoring_sensor_baseline.apis import router as monitoring_sensor_baseline_router
from app.monitoring_sensor_data.apis import router as monitoring_sensor_data_router
from app.checklists.apis import router as checklists_router

# Lifespan (startup, shutdown)
@asynccontextmanager
async def lifespan(_: FastAPI):
    """This is the startup and shutdown code for the FastAPI application."""
    # Startup code
    print("System Call: Enhance Armament x_x")  # SAO Reference

    # Bigger Threadpool i.e you send a bunch of requests it will handle a max of 1000 at a time, the default is 40
    limiter = to_thread.current_default_thread_limiter()
    limiter.total_tokens = 1000

    # Shutdown
    yield
    print("System Call: Release Recollection...")


app = FastAPI(
    title="RWM(FastAPI)",
    docs_url="/",
    swagger_ui_parameters={
        "defaultModelsExpandDepth": -1
    },  # Hides Schemas Menu in Docs
    lifespan=lifespan,
    default_response_class=ORJSONResponse,
)

# Variables
origins = ["*"]

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    GZipMiddleware,
    minimum_size=5000,  # Minimum size of the response before it is compressed in bytes
)


# Health Check
@app.get("/health", status_code=200, include_in_schema=False)
async def health_check(db=Depends(get_db)):
    """This is the health check endpoint"""
    return {"status": "ok"}

# Token Endpoint
@app.post("/token", response_model=schemas.Token, tags=["auth"])
async def token(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    return await login_for_access_token(form_data, db)

# CRUD ROUTERS SECURED VIA DEPENDENCIES, MOVE TO INDIVIDUAL IF NECESSARY
# Routers
app.include_router(user_router)
app.include_router(project_router, dependencies=[])
app.include_router(location_router, dependencies=[])
app.include_router(location_task_router, dependencies=[])
app.include_router(monitoring_group_router, dependencies=[])
app.include_router(monitoring_source_router, dependencies=[])
app.include_router(monitoring_sensor_router, dependencies=[])
app.include_router(monitoring_sensor_alert_router, dependencies=[])
app.include_router(monitoring_sensor_baseline_router, dependencies=[])
app.include_router(monitoring_sensor_data_router, dependencies=[])
app.include_router(checklists_router, dependencies=[])
