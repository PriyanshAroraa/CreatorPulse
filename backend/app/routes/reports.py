from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.database import get_database
from app.models import ReportCreate, ReportResponse, ReportData
from app.services import analytics_service
from app.routes.auth import get_current_user, require_auth
from app.models.user import User

router = APIRouter()


async def generate_report_data(
    channel_id: str, 
    date_from: datetime, 
    date_to: datetime,
    user_id: Optional[str] = None
) -> ReportData:
    """Generate report data for a channel."""
    db = get_database()
    
    base_query = {"channel_id": channel_id}
    if user_id:
        base_query["user_id"] = user_id
    
    # Get sentiment breakdown
    sentiment = await analytics_service.get_sentiment_breakdown(channel_id, user_id, date_from, date_to)
    
    # Get tag breakdown
    tags = await analytics_service.get_tag_breakdown(channel_id, user_id, date_from, date_to)
    
    # Get top videos
    top_videos = await analytics_service.get_top_videos(channel_id, 10, user_id)
    
    # Get trends
    days = (date_to - date_from).days
    trends = await analytics_service.get_sentiment_over_time(channel_id, days, user_id)
    
    # Get top commenters
    commenters = await db.commenters.find(
        base_query
    ).sort("comment_count", -1).limit(10).to_list(10)
    
    top_commenters = [
        {
            "author_name": c['author_name'],
            "comment_count": c['comment_count'],
            "is_repeat": c.get('is_repeat', False)
        }
        for c in commenters
    ]
    
    # Count totals
    total_comments = await db.comments.count_documents({
        **base_query,
        "published_at": {"$gte": date_from, "$lte": date_to}
    })
    
    total_videos = await db.videos.count_documents({
        **base_query,
        "published_at": {"$gte": date_from, "$lte": date_to}
    })
    
    unique_commenters = await db.commenters.count_documents(base_query)
    
    return ReportData(
        total_comments=total_comments,
        total_videos=total_videos,
        unique_commenters=unique_commenters,
        sentiment_breakdown=sentiment['breakdown'],
        sentiment_percentage=sentiment['percentages'],
        tag_breakdown=tags,
        top_videos=top_videos,
        top_commenters=top_commenters,
        comments_over_time=trends,
        sentiment_over_time=trends
    )


@router.post("", response_model=ReportResponse)
async def create_report(
    report: ReportCreate, 
    background_tasks: BackgroundTasks,
    user: User = Depends(require_auth)
):
    """Create a new report."""
    db = get_database()
    
    # Get channel name for title (ensure user owns it)
    channel = await db.channels.find_one({
        "channel_id": report.channel_id,
        "user_id": user.google_id
    })
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    title = report.title or f"{channel['name']} Report - {report.date_from.strftime('%Y-%m-%d')} to {report.date_to.strftime('%Y-%m-%d')}"
    
    # Generate report data
    report_data = await generate_report_data(
        report.channel_id,
        report.date_from,
        report.date_to,
        user.google_id
    )
    
    report_doc = {
        "channel_id": report.channel_id,
        "user_id": user.google_id,  # Link to user
        "title": title,
        "date_from": report.date_from,
        "date_to": report.date_to,
        "data": report_data.model_dump(),
        "status": "completed",
        "created_at": datetime.utcnow(),
        "completed_at": datetime.utcnow()
    }
    
    result = await db.reports.insert_one(report_doc)
    report_doc['id'] = str(result.inserted_id)
    
    return ReportResponse(**report_doc)


@router.get("/channel/{channel_id}", response_model=List[ReportResponse])
async def list_reports(
    channel_id: str,
    user: Optional[User] = Depends(get_current_user)
):
    """List all reports for a channel."""
    db = get_database()
    
    query = {"channel_id": channel_id}
    if user:
        query["user_id"] = user.google_id
    
    reports = await db.reports.find(query).sort("created_at", -1).to_list(50)
    
    for report in reports:
        report['id'] = str(report['_id'])
    
    return [ReportResponse(**r) for r in reports]


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    user: Optional[User] = Depends(get_current_user)
):
    """Get a specific report."""
    db = get_database()
    
    try:
        query = {"_id": ObjectId(report_id)}
        if user:
            query["user_id"] = user.google_id
        report = await db.reports.find_one(query)
    except:
        raise HTTPException(status_code=400, detail="Invalid report ID")
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report['id'] = str(report['_id'])
    return ReportResponse(**report)


@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    user: Optional[User] = Depends(get_current_user)
):
    """Download report as JSON."""
    db = get_database()
    
    try:
        query = {"_id": ObjectId(report_id)}
        if user:
            query["user_id"] = user.google_id
        report = await db.reports.find_one(query)
    except:
        raise HTTPException(status_code=400, detail="Invalid report ID")
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Convert ObjectId to string
    report['_id'] = str(report['_id'])
    
    # Convert datetime objects
    for key in ['date_from', 'date_to', 'created_at', 'completed_at']:
        if report.get(key):
            report[key] = report[key].isoformat()
    
    return JSONResponse(
        content=report,
        headers={
            "Content-Disposition": f"attachment; filename=report_{report_id}.json"
        }
    )


@router.delete("/{report_id}")
async def delete_report(
    report_id: str,
    user: User = Depends(require_auth)
):
    """Delete a report."""
    db = get_database()
    
    try:
        result = await db.reports.delete_one({
            "_id": ObjectId(report_id),
            "user_id": user.google_id
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid report ID")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"message": "Report deleted"}
