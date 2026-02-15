from datetime import datetime, timedelta
from shared.utils.calendar import generate_calendar_links

def test_calendar_links():
    start = datetime(2026, 3, 1, 10, 0, 0)
    end = start + timedelta(minutes=45)
    title = "Test Call"
    desc = "Test Description with Link: https://jit.si/test"
    loc = "https://jit.si/test"
    
    links = generate_calendar_links(title, start, end, desc, loc)
    
    print(f"Google: {links['google']}")
    print(f"Outlook: {links['outlook']}")
    
    # Simple checks
    assert "text=Test%20Call" in links["google"]
    assert "20260301T100000Z" in links["google"]
    assert "subject=Test%20Call" in links["outlook"]
    assert "2026-03-01T10:00:00Z" in links["outlook"]
    
    print("✅ All check pass!")

if __name__ == "__main__":
    test_calendar_links()
