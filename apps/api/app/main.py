from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, levels, progress, quests, characters, progression, dev


app = FastAPI(
    title=settings.APP_NAME,
    description="Learn to code by playing - API backend",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(levels.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(quests.router, prefix="/api")
app.include_router(characters.router, prefix="/api")
app.include_router(progression.router, prefix="/api")
app.include_router(dev.router, prefix="/api")


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "app": settings.APP_NAME}


@app.get("/api")
def api_root():
    """API root endpoint"""
    return {
        "message": "CodingCrazy API",
        "version": "0.1.0",
        "docs": "/docs",
    }
