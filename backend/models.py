from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class CaseCreate(BaseModel):
    case_number: str = Field(min_length=3, max_length=50)
    case_title: str = Field(min_length=3, max_length=150)
    client_name: str = Field(min_length=2, max_length=100)
    status: Literal["Open", "Pending", "Closed"] = "Open"
    next_hearing_date: date | None = None
    notes: str | None = Field(default=None, max_length=500)


class CaseUpdate(BaseModel):
    case_title: str | None = Field(
        default=None,
        min_length=3,
        max_length=150
    )
    client_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )
    status: Literal["Open", "Pending", "Closed"] | None = None
    next_hearing_date: date | None = None
    notes: str | None = Field(default=None, max_length=500)