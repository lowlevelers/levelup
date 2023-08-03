import Logo from '@/components/ui/ToolCard/Tool.Logo';
import Name from '@/components/ui/ToolCard/Tool.Name';
import Tags from '@/components/ui/ToolCard/Tool.Tags';
import Title from '@/components/ui/ToolCard/Tool.Title';
import Votes from '@/components/ui/ToolCard/Tool.Votes';
import ToolCard from '@/components/ui/ToolCard/ToolCard';

import ProfileService from '@/utils/supabase/services/profile';
import ProductsService from '@/utils/supabase/services/products';
import UserProfileInfo from '@/components/ui/UserProfileInfo/UserProfileInfo';
import { type Comment as CommentType, type Product, type Profile } from '@/utils/supabase/types';
import Page404 from '@/components/ui/Page404/Page404';
import ToolCardList, { type ITool } from '@/components/ui/ToolCardList/ToolCardList';
import { Comment, CommentContext, CommentDate, CommentUserAvatar, CommentUserName, Comments } from '@/components/ui/Comment';
import { createBrowserClient } from '@/utils/supabase/browser';
import moment from 'moment';
import Link from 'next/link';
import { createServerClient } from '@/utils/supabase/server';
import { type Metadata } from 'next';
import TrendingToolsList from '@/components/ui/TrendingToolsList';

interface IComment extends CommentType {
  profiles: Profile;
  products: Product;
}

// set dynamic metadata
export async function generateMetadata({ params: { user } }: { params: { user: string } }): Promise<Metadata> {
  const username = decodeURIComponent(user).slice(1);
  const supabaseClient = createServerClient();
  const profileService = new ProfileService(supabaseClient);
  const profile = await profileService.getByUsername(username);

  return {
    title: `${profile?.full_name}'s profile on Dev Hunt - Dev Hunt`,
    description: profile?.headline,
    openGraph: {
      type: 'article',
      title: `${profile?.full_name}'s profile on Dev Hunt - Dev Hunt`,
      description: profile?.headline as string,
      images: [(profile?.avatar_url as string) || ''],
    },
    twitter: {
      title: `${profile?.full_name}'s profile on Dev Hunt - Dev Hunt`,
      description: profile?.headline as string,
      card: 'summary_large_image',
      images: [profile?.avatar_url ?? ''],
    },
  };
}

export default async ({ params: { user } }: { params: { user: string } }) => {
  const username = decodeURIComponent(user).slice(1);
  const browserService = createBrowserClient();
  const profileService = new ProfileService(browserService);
  const profile = await profileService.getByUsername(username);

  if (profile) {
    const tools = await new ProductsService(browserService).getUserProductsById(profile?.id);

    const activity = await profileService.getUserActivityById(profile?.id);
    const votedTools = await profileService.getUserVoteTools(profile?.id);

    return (
      <div className="container-custom-screen mt-10 mb-32 space-y-10">
        <UserProfileInfo profile={profile} />
        {tools && tools?.length > 0 ? (
          <div>
            <h3 className="font-medium text-slate-50">Launches</h3>
            <ul className="mt-3 divide-y divide-slate-800/60">
              {tools.map((tool, idx) => (
                <ToolCardList key={idx} tool={tool as ITool} />
              ))}
            </ul>
          </div>
        ) : (
          ''
        )}
        {votedTools && votedTools?.length > 0 ? (
          <div>
            <h3 className="font-medium text-slate-50">{votedTools?.length} Upvotes</h3>
            <ul className="mt-3 divide-y divide-slate-800/60">
              {votedTools.map((tool: any, idx: number) => (
                <li key={idx} className="py-3">
                  <ToolCard href={`/tool/${tool.slug}`}>
                    <Link href={'/tool/' + tool.slug} className="w-full flex items-center gap-x-4">
                      <Logo src={tool.logo_url || ''} alt={tool.name} />
                      <div className="space-y-1">
                        <Name>{tool.name}</Name>
                        <Title className="line-clamp-2">{tool.slogan}</Title>
                        <Tags
                          items={[
                            (tool.product_pricing_types as { title: string }).title || 'Free',
                            ...(tool.product_category_product as { name: string }[]).map((c: { name: string }) => c.name),
                          ]}
                        />
                      </div>
                    </Link>
                    <div className="flex-1 self-center flex justify-end">
                      <Votes className="text-orange-500" count={tool.votes_count} productId={tool?.id} launchDate={tool.launch_date} />
                    </div>
                  </ToolCard>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          ''
        )}
        {activity && activity?.length > 0 ? (
          <div>
            <h3 className="font-medium text-slate-50">Activity</h3>
            <Comments className="mt-8">
              {(activity as IComment[]).map((item: IComment, idx) => (
                <Comment key={idx} className="gap-4 sm:gap-6">
                  <CommentUserAvatar src={item.profiles.avatar_url as string} />
                  <div className="flex-1">
                    <Link href={`/tool/${item.products.slug}/#${item.id}`} className="flex-1">
                      <CommentUserName>{item.profiles.full_name}</CommentUserName>
                      <CommentDate className="mt-1">Commented {moment(item.created_at).format('LL')}</CommentDate>
                      <CommentContext className="mt-3 text-slate-400 line-clamp-2">{item.content}</CommentContext>
                    </Link>
                    <ToolCard className="mt-3 border border-slate-800" href={'/tool/' + item.products.slug}>
                      <Link href={'/tool/' + tool.slug} className="w-full flex items-center gap-x-4">
                        <Logo src={item.products.logo_url || ''} alt={item.products.name} imgClassName="w-12 h-12" />
                        <div className="space-y-1">
                          <Name>{item.products.name}</Name>
                          <Title className="line-clamp-2">{item.products.slogan}</Title>
                        </div>
                      </Link>
                      <div className="flex-1 self-center flex justify-end">
                        <Votes count={item.products.votes_count} productId={tool?.id} launchDate={tool.launch_date} />
                      </div>
                    </ToolCard>
                  </div>
                </Comment>
              ))}
            </Comments>
          </div>
        ) : (
          ''
        )}

        <div>
          <h3 className="font-medium text-slate-50">Trending tools</h3>
          <TrendingToolsList />
        </div>
      </div>
    );
  } else return <Page404 />;
};
