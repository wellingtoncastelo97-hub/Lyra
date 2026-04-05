import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ResellerContext = createContext(null);

export const useReseller = () => useContext(ResellerContext);

export const ResellerProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [reseller, setReseller] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchResellerProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchResellerProfile(session.user.id);
            } else {
                setReseller(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchResellerProfile = async (userId) => {
        const { data, error } = await supabase
            .from('resellers')
            .select('*')
            .eq('id', userId)
            .single();

        if (data && !error) {
            setReseller(data);
        }
        setLoading(false);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setReseller(null);
        setSession(null);
    };

    return (
        <ResellerContext.Provider value={{ session, reseller, loading, signOut, refetchProfile: () => fetchResellerProfile(session?.user?.id) }}>
            {children}
        </ResellerContext.Provider>
    );
};
