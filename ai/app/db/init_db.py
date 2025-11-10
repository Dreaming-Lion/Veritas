from app.db.databases import engine, Base
from app.models.user import User 
from app.models.bookmark import Bookmark

def init_db_2():
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
