    import React from 'react';
    import { View, Text, TouchableOpacity } from 'react-native';
    import { globalStyles } from '../styles/globalStyles';

    const UserCard = ({ user, onPress }) => {
    return (
        <TouchableOpacity 
        style={globalStyles.userCard} 
        onPress={onPress}
        activeOpacity={0.7}
        >
        <Text style={globalStyles.userName}>{user.name}</Text>
        <Text style={globalStyles.userEmail}>{user.email}</Text>
        <Text style={globalStyles.userPhone}>{user.phone}</Text>
        <Text style={globalStyles.userWebsite}>{user.website}</Text>
        <Text style={globalStyles.userCompany}>{user.company.name}</Text>
        <Text style={globalStyles.userAddress}>
            {`${user.address.street}, ${user.address.suite}, ${user.address.city}, ${user.address.zipcode}`}
        </Text>
        </TouchableOpacity>
    );
    };

    export default UserCard;