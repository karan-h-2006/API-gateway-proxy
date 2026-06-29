const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) =>{

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({message: 'No token provided'});
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
        if (err) {
            return res.status(403).json({message: 'Invalid token'});
        }
        req.user = data; // store the details of the user in the request.
        next();
    });

}

module.exports = authenticateToken;