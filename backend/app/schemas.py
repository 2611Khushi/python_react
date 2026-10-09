from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

BookStatus = Literal["To read", "Reading", "Finished"]


class BookBase(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    author: str = Field(min_length=1, max_length=120)
    genre: str = Field(default="Other", max_length=60)
    status: BookStatus = "To read"
    pages: int = Field(default=0, ge=0)
    current_page: int = Field(default=0, ge=0)
    rating: int | None = Field(default=None, ge=1, le=5)
    notes: str = Field(default="", max_length=2000)

    @model_validator(mode="after")
    def page_count_is_valid(self):
        if self.current_page > self.pages:
            raise ValueError("Current page cannot exceed total pages")
        return self


class BookCreate(BookBase):
    pass


class BookUpdate(BookBase):
    pass


class BookRead(BookBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
