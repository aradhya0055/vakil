import random
from datetime import date, timedelta

from database import cases_collection

random.seed(42)

clients = [
    "Aster Technologies",
    "BluePeak Industries",
    "Cedar Financial",
    "Delta Retail",
    "Evergreen Pharma",
    "Frontier Logistics",
    "Granite Manufacturing",
    "Horizon Foods",
    "Indigo Systems",
    "Jupiter Energy",
]

matter_types = [
    "Contract Dispute",
    "Compliance Review",
    "Intellectual Property Matter",
    "Vendor Arbitration",
    "Employment Matter",
    "Payment Recovery",
    "Trademark Review",
    "Regulatory Investigation",
    "Lease Dispute",
    "Data Protection Review",
]

notes_options = [
    "Documents submitted for review.",
    "Waiting for response from opposing counsel.",
    "Internal legal review is in progress.",
    "Supporting evidence has been collected.",
    "Client meeting scheduled.",
    "Next action depends on the hearing outcome.",
    "Draft response is being prepared.",
    "Matter requires additional documentation.",
]

statuses = ["Open", "Pending", "Closed"]


def generate_case(case_index):
    client = random.choice(clients)
    matter = random.choice(matter_types)
    case_status = random.choices(
        statuses,
        weights=[45, 35, 20],
        k=1
    )[0]

    if case_status == "Closed":
        hearing_date = None
    else:
        day_offset = random.randint(-12, 75)
        hearing_date = (
            date.today() + timedelta(days=day_offset)
        ).isoformat()

    return {
        "case_number": f"DEMO-{case_index:03d}",
        "case_title": f"{client} - {matter}",
        "client_name": client,
        "status": case_status,
        "next_hearing_date": hearing_date,
        "notes": random.choice(notes_options),
        "is_demo": True,
    }


def seed_cases():
    current_count = cases_collection.count_documents({})

    if current_count >= 100:
        print(
            f"Database already contains {current_count} cases."
        )
        return

    case_index = 1
    inserted_count = 0

    while cases_collection.count_documents({}) < 100:
        case_number = f"DEMO-{case_index:03d}"

        existing_case = cases_collection.find_one(
            {"case_number": case_number}
        )

        if existing_case is None:
            cases_collection.insert_one(
                generate_case(case_index)
            )
            inserted_count += 1

        case_index += 1

    final_count = cases_collection.count_documents({})

    print(f"Inserted {inserted_count} demo cases.")
    print(f"Database now contains {final_count} cases.")


if __name__ == "__main__":
    seed_cases()