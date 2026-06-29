import React from "react";
import ErrorPage from "../pages/ErrorPage";

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, { hasError: boolean}> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.group("ErrorBoundary caught an error");
        console.error("Error message:", error.message);
        console.error(error.stack);
        console.error(info.componentStack);
        console.groupEnd();

        // opcional: enviar a backend
        // sendErrorToServer(error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <ErrorPage
                errorCode="500"
                errorTitle="Error inesperado"
                errorMessage="Algo salió mal en la aplicación. Vuelve a cargar la página."
                />
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
