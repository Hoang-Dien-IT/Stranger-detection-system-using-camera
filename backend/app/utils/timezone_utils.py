"""
Timezone utilities cho SafeFace
Quản lý múi giờ Việt Nam (UTC+7)
"""

from datetime import datetime, timezone, timedelta

# Múi giờ Việt Nam (UTC+7)
VIETNAM_TIMEZONE = timezone(timedelta(hours=7))

def get_vietnam_now() -> datetime:
    """
    Lấy thời gian hiện tại theo múi giờ Việt Nam
    
    Returns:
        datetime: Thời gian hiện tại ở Việt Nam (naive datetime, đã trừ đi 7 tiếng để lưu vào database)
    """
    # Lấy thời gian hiện tại ở Việt Nam và trả về dưới dạng naive datetime
    # để tương thích với cách lưu trữ hiện tại trong database
    vietnam_time = datetime.now(VIETNAM_TIMEZONE)
    return vietnam_time.replace(tzinfo=None)

def vietnam_now() -> datetime:
    """
    Thay thế cho datetime.utcnow() - trả về thời gian hiện tại theo múi giờ Việt Nam
    
    Returns:
        datetime: Thời gian hiện tại Việt Nam (naive datetime)
    """
    return get_vietnam_now()

def utc_to_vietnam(utc_datetime: datetime) -> datetime:
    """
    Chuyển đổi thời gian UTC sang múi giờ Việt Nam
    
    Args:
        utc_datetime: Thời gian UTC (naive datetime)
        
    Returns:
        datetime: Thời gian được chuyển đổi sang múi giờ Việt Nam (naive datetime)
    """
    if utc_datetime.tzinfo is None:
        # Giả định là UTC, chuyển sang Việt Nam
        utc_with_tz = utc_datetime.replace(tzinfo=timezone.utc)
        vietnam_time = utc_with_tz.astimezone(VIETNAM_TIMEZONE)
        return vietnam_time.replace(tzinfo=None)
    else:
        # Đã có timezone info
        vietnam_time = utc_datetime.astimezone(VIETNAM_TIMEZONE)
        return vietnam_time.replace(tzinfo=None)

def vietnam_to_utc(vietnam_datetime: datetime) -> datetime:
    """
    Chuyển đổi thời gian Việt Nam sang UTC
    
    Args:
        vietnam_datetime: Thời gian Việt Nam (naive datetime)
        
    Returns:
        datetime: Thời gian UTC (naive datetime)
    """
    if vietnam_datetime.tzinfo is None:
        # Giả định là múi giờ Việt Nam
        vietnam_with_tz = vietnam_datetime.replace(tzinfo=VIETNAM_TIMEZONE)
        utc_time = vietnam_with_tz.astimezone(timezone.utc)
        return utc_time.replace(tzinfo=None)
    else:
        utc_time = vietnam_datetime.astimezone(timezone.utc)
        return utc_time.replace(tzinfo=None)

def format_vietnam_time(dt: datetime, format_string: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    Format thời gian Việt Nam thành string
    
    Args:
        dt: Datetime object (giả định là thời gian Việt Nam nếu naive)
        format_string: Format string cho datetime
        
    Returns:
        str: Thời gian đã được format
    """
    return dt.strftime(format_string)

def get_start_of_day_vietnam(dt: datetime = None) -> datetime:
    """
    Lấy thời điểm bắt đầu ngày (00:00:00) theo múi giờ Việt Nam
    
    Args:
        dt: Datetime object, nếu None thì dùng thời gian hiện tại
        
    Returns:
        datetime: Thời điểm bắt đầu ngày (naive datetime)
    """
    if dt is None:
        dt = get_vietnam_now()
    
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)

def get_end_of_day_vietnam(dt: datetime = None) -> datetime:
    """
    Lấy thời điểm kết thúc ngày (23:59:59) theo múi giờ Việt Nam
    
    Args:
        dt: Datetime object, nếu None thì dùng thời gian hiện tại
        
    Returns:
        datetime: Thời điểm kết thúc ngày (naive datetime)
    """
    if dt is None:
        dt = get_vietnam_now()
    
    return dt.replace(hour=23, minute=59, second=59, microsecond=999999)

def is_same_day_vietnam(dt1: datetime, dt2: datetime) -> bool:
    """
    Kiểm tra xem hai datetime có cùng ngày trong múi giờ Việt Nam không
    
    Args:
        dt1: Datetime thứ nhất
        dt2: Datetime thứ hai
        
    Returns:
        bool: True nếu cùng ngày
    """
    return dt1.date() == dt2.date()

def add_hours(dt: datetime, hours: int) -> datetime:
    """
    Thêm số giờ vào datetime
    
    Args:
        dt: Datetime object
        hours: Số giờ cần thêm
        
    Returns:
        datetime: Datetime sau khi thêm giờ
    """
    return dt + timedelta(hours=hours)

def subtract_hours(dt: datetime, hours: int) -> datetime:
    """
    Trừ số giờ từ datetime
    
    Args:
        dt: Datetime object
        hours: Số giờ cần trừ
        
    Returns:
        datetime: Datetime sau khi trừ giờ
    """
    return dt - timedelta(hours=hours)
