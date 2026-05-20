-- Force RLS on sensitive tables to ensure even table owners are subject to policies
-- This is a security best practice even if the application doesn't use owner roles

ALTER TABLE public.ab_tests FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_variants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;