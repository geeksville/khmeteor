function findBestEmail(user) {
  if (!user)
    return null

  // Prefer a facebook email if we can
  if (user.services && user.services.facebook)
    return user.services.facebook.email

  for (let e of(user.emails || []))
    if (e.verified)
      return e.address

  return null
}