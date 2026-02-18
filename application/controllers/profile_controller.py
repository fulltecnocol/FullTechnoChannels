from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from infrastructure.database.connection import get_db, AsyncSessionLocal
from core.entities import User, PublicProfile, ProfileLink
from application.middlewares.auth import get_current_owner
from application.dto.profile import (
    PublicProfileCreate,
    PublicProfileUpdate,
    PublicProfileRead,
    ProfileLinkCreate,
    ProfileLinkUpdate,
    ProfileLinkRead,
)

router = APIRouter()

# --- PUBLIC ENDPOINTS ---


RESERVED_SLUGS = {
    "login", "register", "dashboard", "admin", "api", "static", "public", "assets", "404", "500", "terms", "privacy", "how-it-works"
}

@router.get("/p/{slug}", response_model=PublicProfileRead, tags=["Public"])

async def get_public_profile(slug: str, db: AsyncSessionLocal = Depends(get_db)):
    """
    Obtener perfil público por slug.
    Incrementa el contador de visitas.
    """
    result = await db.execute(
        select(PublicProfile)
        .options(selectinload(PublicProfile.links))
        .where(PublicProfile.slug == slug)
        .where(PublicProfile.is_published == True)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
        
    # Increment view count (fire and forget ideally, but here sync for simplicity)
    profile.view_count += 1
    await db.commit()
    await db.refresh(profile)
    
    return profile

# --- OWNER ENDPOINTS ---

@router.get("/owner/public-profile", response_model=PublicProfileRead, tags=["Owner"])
async def get_my_public_profile(
    current_user: User = Depends(get_current_owner),
    db: AsyncSessionLocal = Depends(get_db)
):
    """
    Obtener el perfil del usuario autenticado. Si no existe, lo crea.
    """
    result = await db.execute(
        select(PublicProfile)
        .options(selectinload(PublicProfile.links))
        .where(PublicProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        # Create default profile
        new_profile = PublicProfile(
            user_id=current_user.id,
            slug=current_user.username or f"user{current_user.id}",
            display_name=current_user.full_name or "Usuario FGate",
            avatar_url=current_user.avatar_url
        )
        
        # Ensure slug is not reserved
        if new_profile.slug.lower() in RESERVED_SLUGS:
            new_profile.slug = f"{new_profile.slug}_official"
            
        db.add(new_profile)
        permissions_error = False
        try:
            await db.commit()
            await db.refresh(new_profile)
            profile = new_profile
        except Exception:
            await db.rollback()
            # Fallback if slug exists
            new_profile.slug = f"user{current_user.id}_{initial_random_string()}" 
            await db.commit()
            await db.refresh(new_profile)
            profile = new_profile

    return profile

@router.put("/owner/public-profile", response_model=PublicProfileRead, tags=["Owner"])
async def update_my_public_profile(
    profile_update: PublicProfileUpdate,
    current_user: User = Depends(get_current_owner),
    db: AsyncSessionLocal = Depends(get_db)
):
    result = await db.execute(
        select(PublicProfile)
        .options(selectinload(PublicProfile.links))
        .where(PublicProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
        
    # Update fields
    update_data = profile_update.dict(exclude_unset=True)
    
    # Validate slug if changing
    if "slug" in update_data:
        new_slug = update_data["slug"].lower()
        if new_slug in RESERVED_SLUGS:
             raise HTTPException(status_code=400, detail="Este nombre de usuario no está disponible.")
    
    for key, value in update_data.items():
        setattr(profile, key, value)
        
    await db.commit()
    await db.refresh(profile)
    return profile

# --- LINK MANAGEMENT ---

@router.post("/owner/links", response_model=ProfileLinkRead, tags=["Owner"])
async def create_link(
    link_data: ProfileLinkCreate,
    current_user: User = Depends(get_current_owner),
    db: AsyncSessionLocal = Depends(get_db)
):
    # Get profile first
    result = await db.execute(select(PublicProfile).where(PublicProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Primero debes configurar tu perfil")
        
    new_link = ProfileLink(
        profile_id=profile.id,
        **link_data.dict()
    )
    db.add(new_link)
    await db.commit()
    await db.refresh(new_link)
    return new_link

@router.put("/owner/links/{link_id}", response_model=ProfileLinkRead, tags=["Owner"])
async def update_link(
    link_id: int,
    link_update: ProfileLinkUpdate,
    current_user: User = Depends(get_current_owner),
    db: AsyncSessionLocal = Depends(get_db)
):
    # Verify ownership via profile
    result = await db.execute(
        select(ProfileLink)
        .join(PublicProfile)
        .where(ProfileLink.id == link_id)
        .where(PublicProfile.user_id == current_user.id)
    )
    link = result.scalar_one_or_none()
    
    if not link:
        raise HTTPException(status_code=404, detail="Enlace no encontrado")
        
    for key, value in link_update.dict(exclude_unset=True).items():
        setattr(link, key, value)
        
    await db.commit()
    await db.refresh(link)
    return link

@router.delete("/owner/links/{link_id}", tags=["Owner"])
async def delete_link(
    link_id: int,
    current_user: User = Depends(get_current_owner),
    db: AsyncSessionLocal = Depends(get_db)
):
    result = await db.execute(
        select(ProfileLink)
        .join(PublicProfile)
        .where(ProfileLink.id == link_id)
        .where(PublicProfile.user_id == current_user.id)
    )
    link = result.scalar_one_or_none()
    
    if not link:
        raise HTTPException(status_code=404, detail="Enlace no encontrado")
        
    await db.delete(link)
    await db.commit()
    return {"status": "deleted"}

def initial_random_string():
    import uuid
    return str(uuid.uuid4())[:8]
