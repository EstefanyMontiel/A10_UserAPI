    import React from 'react';
    import { View, ActivityIndicator, Text } from 'react-native';
    import { globalStyles } from '../styles/globalStyles';

    const Loading = ({ message = 'Cargando usuarios...' }) => {
    return (
        <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" /> 
        <Text style={globalStyles.loadingText}>{message}</Text>
        </View>
    );
    };

    export default Loading;