function allowRoles(...roles) {
  return (request, response, next) => {
    if (!roles.includes(request.user.role)) {
      return response.status(403).json({ message: 'Your role does not allow this action.' });
    }
    return next();
  };
}

module.exports = allowRoles;