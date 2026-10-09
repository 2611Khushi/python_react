from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Book
from .schemas import BookCreate, BookRead, BookUpdate


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        if db.scalar(select(Book.id).limit(1)) is None:
            db.add_all(
                [
                    Book(title="The Creative Act", author="Rick Rubin", genre="Creativity", status="Reading", pages=432, current_page=184, notes="A few pages at a time, with a notebook nearby."),
                    Book(title="Braiding Sweetgrass", author="Robin Wall Kimmerer", genre="Nature", status="Finished", pages=408, current_page=408, rating=5, notes="A generous, grounding read."),
                    Book(title="Ways of Seeing", author="John Berger", genre="Art", status="To read", pages=176, current_page=0),
                ]
            )
            db.commit()
    yield


app = FastAPI(title="Fieldnotes Books API", version="1.0.0", lifespan=lifespan)

# The browser app is a separate project, so it needs explicit permission to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/books", response_model=list[BookRead])
def list_books(
    q: str = Query(default="", max_length=160),
    status_filter: str = Query(default="", alias="status"),
    db: Session = Depends(get_db),
):
    statement = select(Book).order_by(Book.id.desc())
    if q.strip():
        search = f"%{q.strip()}%"
        statement = statement.where(Book.title.ilike(search) | Book.author.ilike(search))
    if status_filter:
        statement = statement.where(Book.status == status_filter)
    return db.scalars(statement).all()


@app.post("/api/books", response_model=BookRead, status_code=status.HTTP_201_CREATED)
def create_book(book: BookCreate, db: Session = Depends(get_db)):
    record = Book(**book.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.put("/api/books/{book_id}", response_model=BookRead)
def update_book(book_id: int, book: BookUpdate, db: Session = Depends(get_db)):
    record = db.get(Book, book_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Book not found")
    for field, value in book.model_dump().items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@app.delete("/api/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: int, db: Session = Depends(get_db)):
    record = db.get(Book, book_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Book not found")
    db.delete(record)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
