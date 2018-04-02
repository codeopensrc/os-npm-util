"use strict";

import React from 'react'
import PropTypes from 'prop-types'
import { events } from "../index.js";

class ErrorHandler extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            showErrHandler: false,
            btnHover: false,
            type: "",
            err: ""
        }
        events.on("error", this.openErrHandler.bind(this));
        this.openErrHandler = this.openErrHandler.bind(this);
        this.closeErrHandler = this.closeErrHandler.bind(this);
    }

    componentDidMount() {}

    openErrHandler(data) {
        let type = data && data.type ? data.type : ""
        let err = data && data.err.stack ? data.err.stack : ""
        let splitErr = err.split(/[\n\r]/).map((item, key) => <span key={key}>{item}<br /></span>)
        this.setState({
            showErrHandler: true,
            btnHover: false,
            type: type,
            err: splitErr
        })
    }

    closeErrHandler() {
        this.setState({
            showErrHandler: false,
            btnHover: false,
            type: "",
            err: ""
        })
    }

    render () {

        if(!this.state.showErrHandler) { return null; }

        let styles = {
            container: {
                background: "#f47a64",
                position: "fixed",
                top: 50,
                display: "flex",
                width: "70%",
                justifyContent: "center",
                alignItems: "center",
                border: "8px solid black",
                minHeight: 50,
                fontSize: 18,
                transform: "translate(19%, 0)"
            },
            closeButton: {
                position: "absolute",
                border: "2px solid white",
                top: 0,
                right: 0,
                padding: "6px 14px",
                fontSize: 25,
                background: this.state.btnHover ? "blue" : "white",
                color: this.state.btnHover ? "white" : "black",
                cursor: this.state.btnHover ? "pointer" : "auto",
                boxShadow: "0.5px 0.5px 0px 1px #383737"
            },
            info: {
                marginTop: 30,
                padding: 14
            }
        }

        return (
            <div id={"component-errorhander"} style={styles.container}>
                <div style={styles.closeButton} onClick={this.closeErrHandler}
                onMouseEnter={()=>this.setState({btnHover: true})}
                onMouseLeave={()=>this.setState({btnHover: false})}>
                    X
                </div>
                <div style={styles.info}>
                    Unfortunately an error occured when processing your request. <br />
                    Be sure to refresh the page and review before re-attempting any action previously taken. <br />
                    Please contact the administrator providing the following info:
                    <br />
                    <br />
                    Type: {this.state.type}
                    <br />
                    <br />
                    Err: {this.state.err}
                </div>
            </div>
        )
    }
}

module.exports = ErrorHandler
