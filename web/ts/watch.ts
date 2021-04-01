class Watch {
    private chatInput: HTMLInputElement;
    private ws: WebSocket

    constructor() {
        (document.getElementById("chatForm") as HTMLFormElement).addEventListener("submit", e => this.submitChat(e))
        document.getElementById("chatBox").scrollTop = document.getElementById("chatBox").scrollHeight
        this.chatInput = document.getElementById("chatInput") as HTMLInputElement
        this.ws = new WebSocket("wss://live.mm.rbg.tum.de:443/api/chat/" + (document.getElementById("streamID") as HTMLInputElement).value + "/ws")
        this.ws.onmessage = function (m) {
            const chatElem = Watch.createMessageElement(JSON.parse(m.data))
            document.getElementById("chatBox").appendChild(chatElem)
            document.getElementById("chatBox").scrollTop = document.getElementById("chatBox").scrollHeight
        }
        if (document.getElementById("viewerCount") != null) {
            Watch.loadStat()
            setInterval(function () {
                Watch.loadStat()
            }, 60 * 1000)
        }
    }

    submitChat(e: Event) {
        e.preventDefault()
        this.ws.send(JSON.stringify({
            "msg": this.chatInput.value,
            "anonymous": (document.getElementById("anonymous") as HTMLInputElement).checked
        }))
        this.chatInput.value = ""
        return false//prevent form submission
    }

    private static loadStat() {
        let stat = JSON.parse(Get("/api/chat/" + (document.getElementById("streamID") as HTMLInputElement).value + "/stats"))
        document.getElementById("viewerCount").innerText = stat["viewers"]
    }

    /*
    while I'm not a fan of huge frontend frameworks, this is a good example why they can be useful.
     */
    private static createMessageElement(m): HTMLDivElement {
        // Header:
        let chatElem = document.createElement("div") as HTMLDivElement
        chatElem.classList.add("rounded", "p-2", "mx-2")
        let chatHeader = document.createElement("div") as HTMLDivElement
        chatHeader.classList.add("flex", "flex-row")
        let chatNameField = document.createElement("p") as HTMLParagraphElement
        chatNameField.classList.add("flex-grow", "font-semibold")
        if (m["admin"]){
            chatNameField.classList.add("text-warn")
        }
        chatNameField.innerText = m["name"]
        chatHeader.appendChild(chatNameField)

        const d = new Date
        d.setTime(Date.now())
        let chatTimeField = document.createElement("p") as HTMLParagraphElement
        chatTimeField.classList.add("text-gray-500", "font-thin")
        chatTimeField.innerText = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2)
        chatHeader.appendChild(chatTimeField)
        chatElem.appendChild(chatHeader)

        // Message:
        let chatMessage = document.createElement("p") as HTMLParagraphElement
        chatMessage.classList.add("text-gray-300", "break-words")
        chatMessage.innerText = m["msg"]
        chatElem.appendChild(chatMessage)
        return chatElem
    }
}

new Watch()