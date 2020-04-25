import Axios from "axios";



const api = Axios.create({
    baseURL: '/api/',
});


const chatAPI = {
    getMessages: (groupId) => {
        console.log('Calling get messages from API');
        return api.get(`messages/${groupId}`);
        // return Promise.resolve([]);
    },


    sendMessage: (text) => {
        let msg = {
            sender: "Subhransu",
            content: text
        }

        return api.post(`send`, msg);
    }
}


export default chatAPI;
