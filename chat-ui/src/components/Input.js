import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button';

const Input = ({ onSendMessage }) => {
    const [text, setText] = useState("")

    let onChange = (e) => {
        setText(e.target.value)
    }

    let onSubmit = (e) => {
        e.preventDefault();
        setText("")
        onSendMessage(text);
    }

    return (
        <div className="Input">
            <form onSubmit={e => onSubmit(e)}>
                <input
                    onChange={e => onChange(e)}
                    value={text}
                    type="text"
                    placeholder="Enter your message and press ENTER"
                    autofocus="true"
                />
                <button>Send</button>
                {/* <Button variant="contained" color="primary">
                    Send
                </Button> */}
            </form>
        </div>
    );
}


export default Input
