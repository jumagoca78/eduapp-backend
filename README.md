# EduApp backend
This is the backend for EduApp. We are using the MERNF stack (MongoDB + Express + React + Node + Firebase) for this project.

## Start the server
- Pull and run `npm install`.
- Create the .env configuration file. [See below](#MongoDB).
- Import your Firebase service account. [See below](#Firebase).
- Make sure mongodb is running.
- Run `npm run start:dev` to to start the server in dev mode.

You can use PostMan to send a request to the server. Assuming you're on localhost, use GET `localhost:8000/` and send the request. You should see following response:

```javascript
{
    "message": "EduApp backend works!"
}
```

## Configuration files
### MongoDB
You need to create a .env configuration file to set your database connection settings. Create the `.env` file at root level and add the following variables for local connection...
```bash
    DB_LOCATION=local
    DB_HOST=YOUR_MONGODB_HOST
    DB_PORT=YOUR_SERVER_PORT // usually 27017 for mongo
    DB_NAME=YOUR_MONGODB_NAME
```
to connect to remote MonogoDB...
```bash
    DB_LOCATION=remote
    DB_HOST="YOUR_MONGODB_HOST"
    DB_USER=USER_WITH_ACCESS
    DB_PASS=USER_PASSWORD
```

### Firebase
You will also need to set up the service account details for Firebase authentication. Make sure you include the `service-account.json` file under the `server/config/` directory. You can get this file from the Firebase project.

## Testing
Make sure you include all the necessary tests for your feature. Once your implementation is ready, verify all tests pass with `npm test`.

This will automatically drop the DB, seed anew and start the server but you will need to have mongo running either locally or remotely.

## Seeding
Make sure to add all your seeders to `seeders/index.js`. Seeders need to export a `seed` function for script compatibility.

To seed the database, run `npm run seed`.

## Documentation
- [Board](https://trello.com/eduappback)
- [Architecture](https://drive.google.com/open?id=189EpjWoiuIQwrGSHcb7gFEUf4_Cjabd3)
- [Data model](https://www.lucidchart.com/invitations/accept/69157a37-825d-47ef-a53c-16308f65e7b3)
- [Endpoints](https://drive.google.com/open?id=1oAfR1pvqLKjzzp3_yK_BPk635BDDxN6EUFwXg24uPBE)
- [Validation suit](https://drive.google.com/open?id=1Qv7-VNYZii5T3eXfvRS6P63TOAzUSd6A)
- [Errors reference](https://drive.google.com/open?id=1-hMzWe9HpZYY-a8qsRc7i-owiSEKGDAbCIW6a-QH0EE)
- Please refer to the team's Drive for further documentation.

Please make sure you update the relevant documentation after merging changes.

## Tools
Some of the tools used for this project.
- [Markdown editor](https://pandao.github.io/editor.md/en.html)
- [HTTP Status Codes](https://www.restapitutorial.com/httpstatuscodes.html)
- [URL encoder](https://www.urlencoder.io)
- [Interactive Git branching](https://learngitbranching.js.org/?NODEMO)
