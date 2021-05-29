const axios = require('axios');

const call = () =>
axios.post('http://127.0.0.1:5000/',{
    text:"Hello There"
}).then(response => {
    console.log(response.data);
})

call();