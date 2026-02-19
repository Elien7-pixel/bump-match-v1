
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Alert,
    ScrollView,
    Share,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const PartnerScreen = () => {
    const navigation = useNavigation();
    const { theme, isDark } = useTheme();
    const { user, token, refreshUser } = useAuth();

    const [joinCode, setJoinCode] = useState('');
    const [showJoinInput, setShowJoinInput] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Convex queries
    const partnerInfo = useQuery(
        api.users.getPartnerInfo,
        token ? { token } : "skip"
    );

    const partnerLikedNames = useQuery(
        api.names.getPartnerLikedNames,
        token ? { token } : "skip"
    );

    const matchedNames = useQuery(
        api.names.getMatchedNames,
        token ? { token } : "skip"
    );

    const myInvite = useQuery(
        api.partnerInvites.getMyInvite,
        token ? { token } : "skip"
    );

    // Convex mutations
    const connectPartnerMutation = useMutation(api.users.connectPartner);
    const disconnectPartnerMutation = useMutation(api.users.disconnectPartner);
    const acceptInviteMutation = useMutation(api.partnerInvites.acceptInvite);

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.m,
            paddingTop: theme.spacing.l,
            paddingBottom: theme.spacing.m,
        },
        backButton: {
            padding: theme.spacing.s,
        },
        headerTitle: {
            fontFamily: theme.typography.fontFamilyBold,
            fontSize: theme.typography.sizes.h2,
            color: theme.colors.text,
        },
        content: {
            flex: 1,
            paddingHorizontal: theme.spacing.l,
        },
        connectedCard: {
            backgroundColor: isDark ? '#1E3A8A' : '#E0F2FE',
            borderRadius: theme.borderRadius.l,
            padding: theme.spacing.l,
            marginBottom: theme.spacing.l,
        },
        connectedHeader: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        partnerAvatar: {
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: theme.colors.card,
            alignItems: 'center',
            justifyContent: 'center',
        },
        partnerInfo: {
            marginLeft: theme.spacing.m,
            flex: 1,
        },
        partnerName: {
            fontFamily: theme.typography.fontFamilyBold,
            fontSize: theme.typography.sizes.h3,
            color: theme.colors.text,
        },
        connectedDate: {
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.sizes.small,
            color: theme.colors.grey,
            marginTop: 2,
        },
        disconnectLink: {
            marginTop: theme.spacing.m,
            alignSelf: 'flex-end',
        },
        disconnectText: {
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.sizes.small,
            color: theme.colors.destructive,
        },
        section: {
            marginBottom: theme.spacing.xl,
        },
        sectionTitle: {
            fontFamily: theme.typography.fontFamilyBold,
            fontSize: theme.typography.sizes.body,
            color: theme.colors.text,
            marginBottom: theme.spacing.m,
        },
        matchedNameCard: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
            padding: theme.spacing.m,
            borderRadius: theme.borderRadius.m,
            marginBottom: theme.spacing.s,
        },
        matchedNameText: {
            fontFamily: theme.typography.fontFamilyBold,
            fontSize: theme.typography.sizes.h3,
            color: isDark ? '#D1FAE5' : '#065F46',
        },
        emptyMatches: {
            alignItems: 'center',
            padding: theme.spacing.xl,
            backgroundColor: isDark ? theme.colors.card : '#F9FAFB',
            borderRadius: theme.borderRadius.l,
        },
        emptyText: {
            fontFamily: theme.typography.fontFamilyBold,
            fontSize: theme.typography.sizes.body,
            color: theme.colors.grey,
            marginTop: theme.spacing.m,
        },
        emptySubtext: {
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.sizes.small,
            color: theme.colors.grey,
            textAlign: 'center',
            marginTop: theme.spacing.xs,
        },
        likesContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        likeChip: {
            backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
            paddingHorizontal: theme.spacing.m,
            paddingVertical: theme.spacing.s,
            borderRadius: theme.borderRadius.round,
        },
        likeChipText: {
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.sizes.small,
            color: isDark ? '#FECACA' : '#991B1B',
        },
        inviteSection: {
            alignItems: 'center',
            paddingVertical: theme.spacing.xl,
        },
        iconContainer: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: isDark ? '#1E3A8A' : '#E0F2FE',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.l,
        },
        inviteTitle: {
            fontFamily: theme.typography.fontFamilyBold,
            fontSize: theme.typography.sizes.h2,
            color: theme.colors.text,
            marginBottom: theme.spacing.s,
        },
        inviteSubtitle: {
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.sizes.body,
            color: theme.colors.grey,
            textAlign: 'center',
            paddingHorizontal: theme.spacing.l,
        },
        qrCard: {
            backgroundColor: theme.colors.card,
            borderRadius: theme.borderRadius.l,
            padding: theme.spacing.l,
            alignItems: 'center',
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            marginBottom: theme.spacing.l,
        },
        cardTitle: {
            fontFamily: theme.typography.fontFamilyBold,
            fontSize: theme.typography.sizes.body,
            color: theme.colors.text,
            marginBottom: theme.spacing.m,
        },
        qrContainer: {
            padding: theme.spacing.m,
            backgroundColor: 'white',
            borderRadius: theme.borderRadius.m,
            marginBottom: theme.spacing.m,
        },
        codeBox: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? theme.colors.background : '#F3F4F6',
            padding: theme.spacing.m,
            borderRadius: theme.borderRadius.m,
            width: '100%',
            justifyContent: 'center',
            marginBottom: theme.spacing.m,
        },
        codeLabel: {
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.sizes.body,
            color: theme.colors.grey,
            marginRight: theme.spacing.s,
        },
        codeText: {
            fontFamily: theme.typography.fontFamilyBold,
            fontSize: theme.typography.sizes.h3,
            color: theme.colors.text,
            letterSpacing: 2,
        },
        shareButton: {
            width: '100%',
        },
        joinSection: {
            alignItems: 'center',
            marginBottom: theme.spacing.xl,
        },
        orText: {
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.sizes.small,
            color: theme.colors.grey,
            marginBottom: theme.spacing.m,
        },
        joinButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.card,
            padding: theme.spacing.m,
            borderRadius: theme.borderRadius.m,
            borderWidth: 2,
            borderColor: theme.colors.primary,
            borderStyle: 'dashed',
            width: '100%',
            justifyContent: 'center',
        },
        joinButtonText: {
            fontFamily: theme.typography.fontFamilyBold,
            fontSize: theme.typography.sizes.body,
            color: theme.colors.primary,
            marginLeft: theme.spacing.s,
        },
        joinInputContainer: {
            width: '100%',
        },
        joinInput: {
            backgroundColor: theme.colors.card,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.m,
            padding: theme.spacing.m,
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.sizes.body,
            marginBottom: theme.spacing.m,
            color: theme.colors.text,
        },
        joinButtonRow: {
            flexDirection: 'row',
        },
        featuresSection: {
            marginBottom: theme.spacing.xxl,
        },
        featuresSectionTitle: {
            fontFamily: theme.typography.fontFamilyBold,
            fontSize: theme.typography.sizes.body,
            color: theme.colors.text,
            marginBottom: theme.spacing.l,
            textAlign: 'center',
        },
        featureItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing.m,
        },
        featureIcon: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isDark ? '#1E3A8A' : '#E0F2FE',
            alignItems: 'center',
            justifyContent: 'center',
        },
        featureText: {
            marginLeft: theme.spacing.m,
            flex: 1,
        },
        featureTitle: {
            fontFamily: theme.typography.fontFamilyBold,
            fontSize: theme.typography.sizes.body,
            color: theme.colors.text,
        },
        featureDesc: {
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.sizes.small,
            color: theme.colors.grey,
        },
    }), [theme, isDark]);

    const inviteCode = myInvite?.inviteCode || user?.inviteCode || '';
    const inviteLink = `bumpmatch://join/${inviteCode}`;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join me on BumpMatch to find a name for Baby ${user?.surname || 'ours'}! Use code: ${inviteCode} or tap: ${inviteLink}`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleJoinPartner = async () => {
        if (!joinCode.trim()) {
            Alert.alert('Required', 'Please enter an invite code.');
            return;
        }

        if (!token) {
            Alert.alert('Error', 'You must be logged in to connect with a partner.');
            return;
        }

        setIsConnecting(true);

        try {
            const result = await acceptInviteMutation({
                token,
                inviteCode: joinCode.trim().toUpperCase(),
            });

            if (result.success) {
                Alert.alert('Connected!', `You're now connected with ${result.partner.firstName}!`);
                setShowJoinInput(false);
                setJoinCode('');
                refreshUser();
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to connect with partner.');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        Alert.alert(
            'Disconnect Partner',
            'Are you sure you want to disconnect from your partner? Your liked names will be preserved.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: async () => {
                        if (!token) return;

                        try {
                            await disconnectPartnerMutation({ token });
                            refreshUser();
                            Alert.alert('Disconnected', 'You have been disconnected from your partner.');
                        } catch (e: any) {
                            Alert.alert('Error', e.message || 'Failed to disconnect.');
                        }
                    },
                },
            ]
        );
    };

    const isConnected = !!partnerInfo;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Partner</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {isConnected && partnerInfo ? (
                    // Connected State
                    <>
                        <View style={styles.connectedCard}>
                            <View style={styles.connectedHeader}>
                                <View style={styles.partnerAvatar}>
                                    <Ionicons name="heart" size={32} color={theme.colors.primary} />
                                </View>
                                <View style={styles.partnerInfo}>
                                    <Text style={styles.partnerName}>
                                        Connected with {partnerInfo.firstName}
                                    </Text>
                                    <Text style={styles.connectedDate}>
                                        {partnerInfo.surname} family
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.disconnectLink} onPress={handleDisconnect}>
                                <Text style={styles.disconnectText}>Disconnect</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Matched Names */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="heart" size={16} color={theme.colors.primary} /> Matched Names
                            </Text>
                            {matchedNames && matchedNames.length > 0 ? (
                                matchedNames.map((name: any, index: number) => (
                                    <View key={index} style={styles.matchedNameCard}>
                                        <Text style={styles.matchedNameText}>{name.name}</Text>
                                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyMatches}>
                                    <Ionicons name="heart-outline" size={48} color={theme.colors.grey} />
                                    <Text style={styles.emptyText}>No matches yet!</Text>
                                    <Text style={styles.emptySubtext}>
                                        Keep swiping to find names you both love
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Partner's Likes */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                {partnerInfo.firstName}'s Liked Names
                            </Text>
                            {partnerLikedNames && partnerLikedNames.length > 0 ? (
                                <View style={styles.likesContainer}>
                                    {partnerLikedNames.map((name: any, index: number) => (
                                        <View key={index} style={styles.likeChip}>
                                            <Text style={styles.likeChipText}>{name.name}</Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text style={styles.emptySubtext}>
                                    Your partner hasn't liked any names yet
                                </Text>
                            )}
                        </View>
                    </>
                ) : (
                    // Not Connected State
                    <>
                        <View style={styles.inviteSection}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="people" size={48} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.inviteTitle}>Swipe Together!</Text>
                            <Text style={styles.inviteSubtitle}>
                                Connect with your partner to see which baby names you both love
                            </Text>
                        </View>

                        {/* Invite Code & QR */}
                        <View style={styles.qrCard}>
                            <Text style={styles.cardTitle}>Your Invite Code</Text>
                            <View style={styles.qrContainer}>
                                <QRCode value={inviteLink} size={150} />
                            </View>
                            <View style={styles.codeBox}>
                                <Text style={styles.codeLabel}>Code:</Text>
                                <Text style={styles.codeText}>{inviteCode}</Text>
                            </View>
                            <Button title="Share Invite" onPress={handleShare} style={styles.shareButton} />
                        </View>

                        {/* Join Section */}
                        <View style={styles.joinSection}>
                            <Text style={styles.orText}>- OR -</Text>

                            {showJoinInput ? (
                                <View style={styles.joinInputContainer}>
                                    <TextInput
                                        style={styles.joinInput}
                                        placeholder="Enter partner's code (e.g. SMITH-AB12)"
                                        placeholderTextColor={theme.colors.grey}
                                        value={joinCode}
                                        onChangeText={setJoinCode}
                                        autoCapitalize="characters"
                                    />
                                    <View style={styles.joinButtonRow}>
                                        <Button
                                            title="Cancel"
                                            variant="ghost"
                                            onPress={() => setShowJoinInput(false)}
                                            style={{ flex: 1, marginRight: 8 }}
                                            disabled={isConnecting}
                                        />
                                        <Button
                                            title={isConnecting ? "Connecting..." : "Join"}
                                            onPress={handleJoinPartner}
                                            style={{ flex: 1 }}
                                            disabled={isConnecting}
                                        />
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.joinButton}
                                    onPress={() => setShowJoinInput(true)}
                                >
                                    <Ionicons name="enter-outline" size={24} color={theme.colors.primary} />
                                    <Text style={styles.joinButtonText}>Join with Partner's Code</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Features */}
                        <View style={styles.featuresSection}>
                            <Text style={styles.featuresSectionTitle}>What you get with Partner Mode</Text>

                            <View style={styles.featureItem}>
                                <View style={styles.featureIcon}>
                                    <Ionicons name="sync" size={24} color={theme.colors.primary} />
                                </View>
                                <View style={styles.featureText}>
                                    <Text style={styles.featureTitle}>Synced Likes</Text>
                                    <Text style={styles.featureDesc}>See which names you both love</Text>
                                </View>
                            </View>

                            <View style={styles.featureItem}>
                                <View style={styles.featureIcon}>
                                    <Ionicons name="notifications" size={24} color={theme.colors.primary} />
                                </View>
                                <View style={styles.featureText}>
                                    <Text style={styles.featureTitle}>Match Alerts</Text>
                                    <Text style={styles.featureDesc}>Get notified when you match on a name</Text>
                                </View>
                            </View>

                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};
