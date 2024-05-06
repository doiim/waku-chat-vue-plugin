export const scrollToBottom = (messageContainerRef: HTMLElement | null) => {
    setTimeout(() => {
        const container = messageContainerRef;
        if (container) {
            const scrollHeight = container.scrollHeight;
            const scrollTop = container.scrollTop;
            let count = 0;

            const scrollInterval = setInterval(() => {
                if (count < 100) {
                    container.scrollTop = scrollTop + (scrollHeight - scrollTop) * 0.5 * (1 - Math.cos(++count * (Math.PI / 100)));
                } else {
                    clearInterval(scrollInterval);
                }
            }, 5);
        }
    }, 300);
};

export const scrollToMessage = (id: string, messageContainerRef: HTMLElement | null) => {
    setTimeout(() => {
        const container = messageContainerRef;
        if (container) {
            const messageElement = container.querySelector(`#${id}`);
            if (messageElement) {
                const containerRect = container.getBoundingClientRect();
                const messageRect = messageElement.getBoundingClientRect();
                const scrollTop = container.scrollTop;
                const targetTop = messageRect.top - containerRect.top + scrollTop;
                let count = 0;

                const scrollInterval = setInterval(() => {
                    if (count < 100) {
                        container.scrollTop = scrollTop + (targetTop - scrollTop) * 0.5 * (1 - Math.cos(++count * (Math.PI / 100)));
                    } else {
                        clearInterval(scrollInterval);
                    }
                }, 5);
            }
        }
    }, 300);
}