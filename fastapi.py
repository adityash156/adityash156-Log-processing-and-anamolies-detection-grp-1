from fastapi import FastAPI, Body, status
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List
import datetime

app = FastAPI()

# 1. Connect to MongoDB
# Replace with your own connection string from MongoDB Atlas or local
MONGO_URL = "mongodb://localhost:27017" 
client = AsyncIOMotorClient(MONGO_URL)
db = client.food_delivery_db  # Database name
menu_collection = db.get_collection("menu") # Collection name

# 2. Define the Food Item (Pydantic Model)
class FoodItem(BaseModel):
    name: str = Field(...)
    price: float = Field(..., gt=0)
    category: str = Field(...)
    is_available: bool = True

# 3. Create an Endpoint to add food to the Menu
@app.post("/menu/", status_code=status.HTTP_201_CREATED)
async def add_food(food: FoodItem = Body(...)):
    """Add a new dish to the restaurant menu in MongoDB."""
    # Convert Pydantic model to a Python Dictionary for MongoDB
    new_food = await menu_collection.insert_one(food.model_dump())
    return {"id": str(new_food.inserted_id), "message": "Food added successfully!"}

# 4. Create an Endpoint to see the Menu
@app.get("/menu/", response_model=List[FoodItem])
async def list_menu():
    """Retrieve all food items from the database."""
    food_list = await menu_collection.find().to_list(100)
    return food_list