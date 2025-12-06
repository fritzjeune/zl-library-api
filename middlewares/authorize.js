export const authorize = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user.role_name || req.user.role; // depending on your model

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: "You do not have permission to perform this action."
            });
        }

        next();
    };
};
