module.exports = {
    mongoUri: 'mongodb://127.0.0.1/nexus',
    mongoBinUri: 'mongodb://127.0.0.1/nexus-bin',
    ioHost: 'http://127.0.0.1',
    serverPort: 8888,
    serverFreePort: 3000,
    ioServerAddr: 'https://localhost/',
    loginTimeout: 720,
    sslPathKey:'./ssl/localhost.key',
    sslPathCert:'./ssl/localhost.cert',
    //mqttUri: 'mqtt://localhost:1883',
    //mongoMqUri: 'mongodb://localhost/nexusmq',
    //portMq: 1883,
    secret: 'NexusApplication2016',
    mesageDelimiter: '-----------------------------------------------------------------',
    intervalMail: 5,
    intervalService: 5,
    intervalTask: 1,
    automuser: 'automat@xxx.sk',
    profiles: [
        {
            name: 'profile1',
            conn: {
                username: 'oneurobto@gmail.com',
                password: 'heslo',
                reshost: 'imap.googlemail.com',
                resport: 993,
                sndhost: 'smtp.googlemail.com',
                sndport: 465,
                secure: true
            }
        }
    ]
};
