
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
    ActivityIndicator,
    Platform,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '../components/Button';
import { MatchRevealAnimation } from '../components/MatchRevealAnimation';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const PartnerScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { theme, isDark } = useTheme();
    const { user, token, refreshUser } = useAuth();

    const [joinCode, setJoinCode] = useState('');
    const [showJoinInput, setShowJoinInput] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Handle deep link: bumpmatch://join/CODE
    useEffect(() => {
        if (route.params?.code) {
            setJoinCode(route.params.code);
            setShowJoinInput(true);
        }
    }, [route.params?.code]);

    // Convex queries
    const partnerInfo = useQuery(
        api.users.getPartnerInfo,
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

    // Deadline state
    const revealDateInfo = useQuery(
        api.users.getMatchRevealDate,
        token ? { token } : "skip"
    );
    const setRevealDateMutation = useMutation(api.users.setMatchRevealDate);
    const confirmRevealDateMutation = useMutation(api.users.confirmRevealDate);
    const rejectRevealDateMutation = useMutation(api.users.rejectRevealDate);
    const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const hasDeadline = !!revealDateInfo?.date;
    const isConfirmed = revealDateInfo?.confirmed || false;
    const deadlinePassed = hasDeadline && isConfirmed && Date.now() >= revealDateInfo!.date;
    const matchesVisible = hasDeadline && isConfirmed && deadlinePassed;

    // Match reveal state
    const [showMatchReveal, setShowMatchReveal] = useState(false);
    const [newMatchNames, setNewMatchNames] = useState<string[]>([]);

    // Track seen matches and show reveal for new ones
    useEffect(() => {
        const checkNewMatches = async () => {
            if (!matchedNames || matchedNames.length === 0) return;

            try {
                const seenJson = await AsyncStorage.getItem('bumpmatch_seen_matches');
                const seenMatches: string[] = seenJson ? JSON.parse(seenJson) : [];
                const seenSet = new Set(seenMatches);

                const newNames = matchedNames
                    .filter((m: any) => !seenSet.has(m.name))
                    .map((m: any) => m.name);

                if (newNames.length > 0) {
                    setNewMatchNames(newNames);
                    setShowMatchReveal(true);

                    // Mark all current matches as seen
                    const allNames = matchedNames.map((m: any) => m.name);
                    await AsyncStorage.setItem('bumpmatch_seen_matches', JSON.stringify(allNames));
                }
            } catch (e) {
                console.log('Error checking new matches', e);
            }
        };

        checkNewMatches();
    }, [matchedNames]);

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
            fontFamily: theme.typography.fontFamilyDisplay,
            fontSize: theme.typography.sizes.h2,
            color: theme.colors.text,
        },
        content: {
            flex: 1,
            paddingHorizontal: theme.spacing.l,
        },
        connectedCard: {
            backgroundColor: isDark ? theme.colors.card : theme.brand.purpleSoft,
            borderRadius: theme.borderRadius.l,
            borderWidth: 1.5,
            borderColor: isDark ? theme.colors.border : theme.colors.primary,
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
            backgroundColor: isDark ? theme.colors.card : theme.brand.tealSoft,
            padding: theme.spacing.m,
            borderRadius: theme.borderRadius.m,
            marginBottom: theme.spacing.s,
        },
        matchedNameText: {
            fontFamily: theme.typography.fontFamilyBold,
            fontSize: theme.typography.sizes.h3,
            color: isDark ? theme.brand.teal : theme.brand.tealDeep,
        },
        emptyMatches: {
            alignItems: 'center',
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.card,
            borderRadius: theme.borderRadius.l,
            borderWidth: 1.5,
            borderColor: theme.colors.border,
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
            backgroundColor: isDark ? theme.colors.card : theme.brand.pinkSoft,
            paddingHorizontal: theme.spacing.m,
            paddingVertical: theme.spacing.s,
            borderRadius: theme.borderRadius.round,
        },
        likeChipText: {
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.sizes.small,
            color: isDark ? theme.brand.pink : theme.brand.pinkDeep,
        },
        inviteSection: {
            alignItems: 'center',
            paddingVertical: theme.spacing.xl,
        },
        iconContainer: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: isDark ? theme.colors.card : theme.brand.purpleSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.l,
        },
        inviteTitle: {
            fontFamily: theme.typography.fontFamilyDisplay,
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
            borderWidth: 1.5,
            borderColor: theme.colors.border,
            padding: theme.spacing.l,
            alignItems: 'center',
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 6,
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
            backgroundColor: '#FFFFFF',
            borderRadius: theme.borderRadius.m,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: theme.spacing.m,
        },
        codeBox: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? theme.colors.background : theme.brand.purpleSoft,
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
            backgroundColor: isDark ? theme.colors.card : theme.brand.tealSoft,
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
    const siteUrl = (process.env.EXPO_PUBLIC_CONVEX_URL || 'https://silent-ermine-169.convex.cloud').replace('.cloud', '.site');
    const inviteLink = `${siteUrl}/join/${inviteCode}`;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join me on BumpMatch to find a name for Baby ${user?.surname || 'ours'}! Use code: ${inviteCode}\n\n${inviteLink}`,
                url: inviteLink,
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
                                    <Image
                                        source={require('../../assets/brand/characters/crownie.png')}
                                        style={{ width: 46, height: 46 }}
                                        resizeMode="contain"
                                    />
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

                        {/* Reveal Date Section */}
                        <View style={styles.section}>
                            {!hasDeadline ? (
                                /* No date set: show "Set a reveal date" button */
                                <TouchableOpacity
                                    style={[styles.matchedNameCard, { justifyContent: 'center', backgroundColor: isDark ? theme.colors.card : theme.brand.yellowSoft }]}
                                    onPress={() => setShowDeadlinePicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={theme.brand.yellowDeep} style={{ marginRight: 8 }} />
                                    <Text style={[styles.matchedNameText, { color: isDark ? theme.brand.yellow : theme.colors.text, fontSize: 14 }]}>
                                        Set a reveal date for your matches
                                    </Text>
                                </TouchableOpacity>
                            ) : !isConfirmed && revealDateInfo?.proposedByMe ? (
                                /* Date proposed by ME and not confirmed: waiting for partner */
                                <View style={[styles.matchedNameCard, { flexDirection: 'column', alignItems: 'center', paddingVertical: 20, backgroundColor: isDark ? theme.colors.card : theme.brand.yellowSoft }]}>
                                    <Ionicons name="hourglass-outline" size={32} color={theme.brand.yellowDeep} />
                                    <Text style={[styles.matchedNameText, { color: isDark ? theme.brand.yellow : theme.colors.text, marginTop: 8, textAlign: 'center', fontSize: 15 }]}>
                                        Waiting for {partnerInfo.firstName} to confirm
                                    </Text>
                                    <Text style={[styles.emptySubtext, { marginTop: 4 }]}>
                                        {revealDateInfo.date <= Date.now()
                                            ? 'You proposed to reveal matches now'
                                            : `Proposed date: ${new Date(revealDateInfo.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                        }
                                    </Text>
                                    <TouchableOpacity
                                        style={{ marginTop: 12 }}
                                        onPress={async () => {
                                            if (token) {
                                                try {
                                                    await rejectRevealDateMutation({ token });
                                                } catch (e: any) {
                                                    Alert.alert('Error', e.message || 'Failed to cancel proposal.');
                                                }
                                            }
                                        }}
                                    >
                                        <Text style={{ color: theme.colors.destructive, fontFamily: theme.typography.fontFamilyBold, fontSize: 13 }}>
                                            Cancel proposal
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : !isConfirmed && !revealDateInfo?.proposedByMe ? (
                                /* Date proposed by PARTNER and not confirmed: show Confirm / Edit */
                                <View style={[styles.matchedNameCard, { flexDirection: 'column', alignItems: 'center', paddingVertical: 20, backgroundColor: isDark ? theme.colors.card : theme.brand.yellowSoft }]}>
                                    <Ionicons name="notifications-outline" size={32} color={theme.brand.yellowDeep} />
                                    <Text style={[styles.matchedNameText, { color: isDark ? theme.brand.yellow : theme.colors.text, marginTop: 8, textAlign: 'center', fontSize: 15 }]}>
                                        {partnerInfo.firstName} proposed a reveal date
                                    </Text>
                                    <Text style={[styles.emptySubtext, { marginTop: 4 }]}>
                                        {revealDateInfo!.date <= Date.now()
                                            ? `${partnerInfo.firstName} wants to reveal matches now`
                                            : new Date(revealDateInfo!.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
                                        }
                                    </Text>
                                    <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: theme.brand.tealDeep,
                                                paddingHorizontal: 20,
                                                paddingVertical: 10,
                                                borderRadius: theme.borderRadius.m,
                                            }}
                                            onPress={async () => {
                                                if (token) {
                                                    try {
                                                        await confirmRevealDateMutation({ token });
                                                        Alert.alert('Confirmed!', 'The reveal date has been confirmed.');
                                                    } catch (e: any) {
                                                        Alert.alert('Error', e.message || 'Failed to confirm.');
                                                    }
                                                }
                                            }}
                                        >
                                            <Text style={{ color: theme.colors.textLight, fontFamily: theme.typography.fontFamilySemiBold, fontSize: 14 }}>
                                                Confirm
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: theme.colors.card,
                                                borderWidth: 1.5,
                                                borderColor: theme.colors.border,
                                                paddingHorizontal: 20,
                                                paddingVertical: 10,
                                                borderRadius: theme.borderRadius.m,
                                            }}
                                            onPress={async () => {
                                                if (token) {
                                                    try {
                                                        await rejectRevealDateMutation({ token });
                                                        setShowDeadlinePicker(true);
                                                    } catch (e: any) {
                                                        Alert.alert('Error', e.message || 'Failed to reject.');
                                                    }
                                                }
                                            }}
                                        >
                                            <Text style={{ color: theme.colors.text, fontFamily: theme.typography.fontFamilySemiBold, fontSize: 14 }}>
                                                Suggest Different Date
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : isConfirmed && !deadlinePassed ? (
                                /* Date confirmed but not yet reached: locked state */
                                <View style={[styles.matchedNameCard, { flexDirection: 'column', alignItems: 'center', paddingVertical: 20, backgroundColor: isDark ? theme.colors.card : theme.brand.yellowSoft }]}>
                                    <Ionicons name="lock-closed" size={32} color={theme.brand.yellowDeep} />
                                    <Text style={[styles.matchedNameText, { color: isDark ? theme.brand.yellow : theme.colors.text, marginTop: 8, textAlign: 'center' }]}>
                                        {matchedNames?.length || 0} {(matchedNames?.length || 0) === 1 ? 'match' : 'matches'} waiting!
                                    </Text>
                                    <Text style={[styles.emptySubtext, { marginTop: 4 }]}>
                                        Reveals on {new Date(revealDateInfo!.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Text>
                                    <TouchableOpacity
                                        style={{ marginTop: 12 }}
                                        onPress={() => {
                                            Alert.alert(
                                                'Reveal Now',
                                                'This will send a request to your partner. Both of you must agree to reveal early.',
                                                [
                                                    { text: 'Keep Waiting', style: 'cancel' },
                                                    {
                                                        text: 'Request Reveal Now',
                                                        onPress: async () => {
                                                            if (token) {
                                                                try {
                                                                    await setRevealDateMutation({ token, revealDate: Date.now() });
                                                                } catch (e: any) {
                                                                    Alert.alert('Error', e.message || 'Failed to request early reveal.');
                                                                }
                                                            }
                                                        },
                                                    },
                                                ]
                                            );
                                        }}
                                    >
                                        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamilyBold, fontSize: 13 }}>
                                            Reveal now instead
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null}

                            {showDeadlinePicker && (
                                <View style={{ marginVertical: 8, alignItems: 'center' }}>
                                    <DateTimePicker
                                        value={selectedDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                                        maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
                                        onChange={(event, selected) => {
                                            if (Platform.OS === 'android') {
                                                if (event.type === 'dismissed') {
                                                    setShowDeadlinePicker(false);
                                                    return;
                                                }
                                            }
                                            if (selected) setSelectedDate(selected);
                                        }}
                                    />
                                    {selectedDate && (
                                        <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginTop: 8 }}>
                                            {selectedDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </Text>
                                    )}
                                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: theme.colors.card,
                                                borderWidth: 1.5,
                                                borderColor: theme.colors.border,
                                                paddingHorizontal: 20,
                                                paddingVertical: 10,
                                                borderRadius: theme.borderRadius.m,
                                            }}
                                            onPress={() => {
                                                setShowDeadlinePicker(false);
                                                setSelectedDate(null);
                                            }}
                                        >
                                            <Text style={{ color: theme.colors.text, fontFamily: theme.typography.fontFamilySemiBold, fontSize: 14 }}>
                                                Cancel
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: theme.brand.tealDeep,
                                                paddingHorizontal: 20,
                                                paddingVertical: 10,
                                                borderRadius: theme.borderRadius.m,
                                            }}
                                            onPress={async () => {
                                                const dateToPropose = selectedDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                                                if (token) {
                                                    try {
                                                        await setRevealDateMutation({ token, revealDate: dateToPropose.getTime() });
                                                        setShowDeadlinePicker(false);
                                                        setSelectedDate(null);
                                                        Alert.alert('Date Proposed!', `Your partner will need to confirm: ${dateToPropose.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}`);
                                                    } catch (e: any) {
                                                        Alert.alert('Error', e.message || 'Failed to set reveal date.');
                                                    }
                                                }
                                            }}
                                        >
                                            <Text style={{ color: theme.colors.textLight, fontFamily: theme.typography.fontFamilySemiBold, fontSize: 14 }}>
                                                Propose Date
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Matched Names - only visible when confirmed AND deadline passed */}
                        {matchesVisible && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="heart" size={16} color={theme.colors.primary} /> Matched Names
                            </Text>
                            {matchedNames && matchedNames.length > 0 ? (
                                matchedNames.map((name: any, index: number) => (
                                    <View key={index} style={styles.matchedNameCard}>
                                        <Text style={styles.matchedNameText}>{name.name}</Text>
                                        <Ionicons name="checkmark-circle" size={24} color={theme.brand.tealDeep} />
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
                        )}
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
                                <QRCode value={inviteLink} size={150} color={theme.brand.ink} backgroundColor="#FFFFFF" />
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

            <MatchRevealAnimation
                visible={showMatchReveal}
                matchedNames={newMatchNames}
                onDismiss={() => setShowMatchReveal(false)}
            />
        </SafeAreaView>
    );
};
