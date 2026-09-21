from fastapi import FastAPI, HTTPException, status
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
from fastapi.middleware.cors import CORSMiddleware
from database import cases_collection, check_database_connection
from models import CaseCreate, CaseUpdate

app = FastAPI(title="Vakil Case Tracker API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
def serialize_case(case_document):
    return {
        "id": str(case_document["_id"]),
        "case_number": case_document["case_number"],
        "case_title": case_document["case_title"],
        "client_name": case_document["client_name"],
        "status": case_document["status"],
        "next_hearing_date": case_document.get("next_hearing_date"),
        "notes": case_document.get("notes")
    }

@app.get("/")
def home():
    return {"message": "Vakil API is running"}


@app.get("/health")
def health_check():
    try:
        check_database_connection()

        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is unavailable"
        ) from error


@app.post("/cases", status_code=status.HTTP_201_CREATED)
def create_case(case: CaseCreate):
    case_document = case.model_dump(mode="json")

    try:
        result = cases_collection.insert_one(case_document)
    except DuplicateKeyError as error:
        raise HTTPException(
            status_code=409,
            detail="A case with this case number already exists"
        ) from error
    
    case_document.pop("_id", None)
    
    return {
        "id": str(result.inserted_id),
        **case_document
    }
@app.get("/cases")
def get_all_cases():
    case_documents = cases_collection.find()

    return [
        serialize_case(case_document)
        for case_document in case_documents
    ]
@app.get("/cases/{case_number}")
def get_case(case_number: str):
    case_document = cases_collection.find_one(
        {"case_number": case_number}
    )

    if case_document is None:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    return serialize_case(case_document)
@app.patch("/cases/{case_number}")
def update_case(case_number: str, case: CaseUpdate):
    updates = case.model_dump(
        exclude_none=True,
        mode="json"
    )

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one field to update"
        )

    updated_case = cases_collection.find_one_and_update(
        {"case_number": case_number},
        {"$set": updates},
        return_document=ReturnDocument.AFTER
    )

    if updated_case is None:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    return serialize_case(updated_case)
@app.delete("/cases/{case_number}")
def delete_case(case_number: str):
    result = cases_collection.delete_one(
        {"case_number": case_number}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    return {
        "message": f"Case {case_number} deleted successfully"
    }