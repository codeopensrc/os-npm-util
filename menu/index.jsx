"use strict";

const React = require('react');
const DOM = require('react-dom');

const { api } = require("../index.js");

class Menu extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            servers: [],
            showList: false
        }
        this.toggleList = this.toggleList.bind(this)
    }

    componentDidMount() {
        api.get("/menu", (res) => {
            if(!res || !res.status) { return console.log("Menu not available"); }
            let servers = res.apps.map((app) => {
                return {
                    name: app.name[0].toUpperCase()+app.name.substr(1),
                    link: app.url
                }
            })
            this.setState({servers: servers})
        })
    }

    toggleList() {
        this.setState({showList: !this.state.showList})
    }

    render() {
        let hamburgerImg = "data:text/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAQAAACQ9RH5AAAABGdBTUEAALGPC/xhBQ"
        +"AAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAAAGAAAABfA"
        +"Ki1aPMAAAAHdElNRQfiAg8HAScMpcGwAAAAnUlEQVRYw+3VsQ2DMBRF0RuUIShTwQ7ZAykjZpK01FClZIiInyKiwEppGyHd48p28S"
        +"TL9gNJOptLMrsmK/kEH+JfcMOdBzeaQsErb568WNONgYUoPBaGNLZlLB4bBCPtdsA/PV2hI97r6PfB1W3BE3OVvJkpXap8uQ57Tod9I"
        +"FIx1qK1mJu1iLWYn7WoWqxFazE3axFrMT9rUdLpfQG/+gTNu/3ttwAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxOC0wMi0xNFQyMjoxNjoxO"
        +"C0wODowMEUTo5AAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTgtMDItMTRUMjI6MTY6MTgtMDg6MDA0ThssAAAASnRFWHRzaWduYXR1cmUANTA4"
        +"MGRlN2M3ODg1Y2NlMjI0ZTAyMDQ2Y2NiMjEzZTZiODE5MzVkMTViNDJhZWNiNjU2ZDUzZWIyYTUxNThiNa7DzeIAAAAASUVORK5CYII="
        let styles = {
            header: {
                height: "25px",
                width: "25px",
                bottom: "0px",
                left: "0px",
                position: "fixed",
                zIndex: "100"
            },
            container: {
                textAlign: "center",
                background: "#555",
                display: this.state.showList ? "flex" : "none",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                bottom: "25px",
                left: "0px",
                position: "absolute",
                padding: "4px"
            },
            button: {
                border: "1px solid black",
                width: "100%",
                height: "24px",
                background: "#e12429",
                color: "white",
                textDecoration: "none",
                margin: "1px 7px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Arial,sans-serif"
            },
            icon: {
                height: "100%",
                width: "100%",
                backgroundImage: "url('"+hamburgerImg+"')",
                backgroundSize: "20px 20px",
                backgroundRepeat: "no-repeat"
            }
        }

        let servers = this.state.servers.map((server, ind) => {
            return (
                <a style={styles.button} key={server + ind} href={server.link}>
                    {server.name}
                </a>
            )
        })

        return (
            <div id="component-hamburger" style={styles.header}>
                <button style={styles.icon} onClick={this.toggleList}></button>
                <div id="button-container" style={styles.container}>
                    {servers}
                </div>
            </div>
        );
    }

}

module.exports = Menu
