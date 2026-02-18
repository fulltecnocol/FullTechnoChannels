import urllib.parse
from datetime import datetime

def generate_calendar_links(title: str, start_time: datetime, end_time: datetime, description: str = "", location: str = "") -> dict:
    """
    Generates URLs for adding an event to various calendar providers.
    """
    # Format times for URLs (YYYYMMDDTHHMMSSZ)
    fmt = "%Y%m%dT%H%M%SZ"
    s_time = start_time.strftime(fmt)
    e_time = end_time.strftime(fmt)
    
    encoded_title = urllib.parse.quote(title)
    encoded_description = urllib.parse.quote(description)
    encoded_location = urllib.parse.quote(location)
    
    # Google Calendar
    google_url = (
        f"https://www.google.com/calendar/render?action=TEMPLATE"
        f"&text={encoded_title}"
        f"&dates={s_time}/{e_time}"
        f"&details={encoded_description}"
        f"&location={encoded_location}"
    )
    
    # Outlook.com (Web)
    outlook_url = (
        f"https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent"
        f"&subject={encoded_title}"
        f"&startdt={start_time.isoformat()}Z"
        f"&enddt={end_time.isoformat()}Z"
        f"&body={encoded_description}"
        f"&location={encoded_location}"
    )
    
    # Yahoo Calendar
    # Yahoo requires a duration or specific end time format, standardizing on a simple version
    yahoo_url = (
        f"https://calendar.yahoo.com/?v=60&view=d&type=20"
        f"&title={encoded_title}"
        f"&st={s_time}"
        f"&et={e_time}"
        f"&desc={encoded_description}"
        f"&in_loc={encoded_location}"
    )

    return {
        "google": google_url,
        "outlook": outlook_url,
        "yahoo": yahoo_url
    }
