const Hapi = require('@hapi/hapi');
const routes = require('./routes');
require('dotenv').config();

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT || 9000,
        host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
        routes: {
            cors: {
                origin: ['*'],
                headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Headers', 'Access-Control-Allow-Methods', 'Origin', 'X-Requested-With'],
                credentials: true,
                additionalHeaders: ['X-Requested-With', 'X-HTTP-Method-Override']
            }
        }
    });

    server.route(routes);

    server.ext('onPreResponse', (request, h) => {
        const response = request.response;
        
        if (response.isBoom) {
            response.output.headers['Access-Control-Allow-Origin'] = '*';
            response.output.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
            response.output.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            response.output.headers['Access-Control-Allow-Credentials'] = 'true';
        } else {
            response.header('Access-Control-Allow-Origin', '*');
            response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.header('Access-Control-Allow-Credentials', 'true');
        }
        
        if (response.isBoom) {
            const statusCode = response.output.statusCode;
            
            if (statusCode === 401) {
                return h.response({
                    status: 'fail',
                    message: 'Token tidak valid atau sudah expired'
                }).code(401);
            }
            
            if (statusCode === 403) {
                return h.response({
                    status: 'fail',
                    message: 'Akses ditolak'
                }).code(403);
            }

            if (statusCode === 404) {
                return h.response({
                    status: 'fail',
                    message: 'Resource tidak ditemukan'
                }).code(404);
            }
            
            console.error('Server Error:', response);
            return h.response({
                status: 'error',
                message: 'Terjadi kesalahan pada server'
            }).code(500);
        }
        
        return h.continue;
    });

    await server.start();
    console.log(`Kalkulori API server berjalan pada ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('Server stopping...');
    process.exit(0);
});

init().catch(err => {
    console.error('Server failed to start:', err);
    process.exit(1);
});