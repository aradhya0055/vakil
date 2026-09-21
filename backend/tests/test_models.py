import pytest
from pydantic import ValidationError

from models import CaseCreate


def test_valid_case_is_accepted():
    legal_case = CaseCreate(
        case_number="CASE-200",
        case_title="ABC Ltd vs XYZ Ltd",
        client_name="ABC Ltd",
        status="Open"
    )

    assert legal_case.case_number == "CASE-200"
    assert legal_case.status == "Open"


def test_invalid_status_is_rejected():
    with pytest.raises(ValidationError):
        CaseCreate(
            case_number="CASE-201",
            case_title="ABC Ltd vs XYZ Ltd",
            client_name="ABC Ltd",
            status="Unknown"
        )


def test_short_case_number_is_rejected():
    with pytest.raises(ValidationError):
        CaseCreate(
            case_number="A",
            case_title="ABC Ltd vs XYZ Ltd",
            client_name="ABC Ltd"
        )


def test_optional_fields_can_be_empty():
    legal_case = CaseCreate(
        case_number="CASE-202",
        case_title="PQR Ltd vs LMN Ltd",
        client_name="PQR Ltd"
    )

    assert legal_case.next_hearing_date is None
    assert legal_case.notes is None