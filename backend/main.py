from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
import cloudinary
from dotenv import load_dotenv

from routers import auth, products, submissions, admin, history, report

load_dotenv() 

cloudinary.config(
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key = os.getenv("CLOUDINARY_API_KEY"),
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
)


Path("uploads").mkdir(exist_ok=True)


app = FastAPI(
    title="DZnutri API",
    description="API for DZnutri product management system",
    version="1.0.0"
)

# Toute URL commençant par /uploads cherchera un fichier dans le dossier "uploads".
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads") 

# CORS configuration for frontend
# TODO: In production, replace ["*"] with specific origins
origins = [
    "http://localhost:3000", # React default
    "http://localhost:8081", # Expo default
    "http://localhost:19000", # Expo default
    "http://localhost:19006", # Expo web
    # Add your production domains here
]

app.add_middleware( 
    CORSMiddleware,
    allow_origins=origins if os.getenv("ENVIRONMENT") == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "DZnutri API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "service": "dznutri-api"}

# Include Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(submissions.router)
app.include_router(admin.router)
app.include_router(history.router)
app.include_router(report.router)