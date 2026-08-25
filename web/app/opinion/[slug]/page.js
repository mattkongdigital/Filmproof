import { PostArticle } from '../../../components/editorial';
import { postParams, postMetadata } from '../../../lib/posts';

export const generateStaticParams = () => postParams('opinion');

export const generateMetadata = ({ params }) => postMetadata('opinion', params.slug);

export default function Page({ params }) {
  return <PostArticle silo="opinion" slug={params.slug} />;
}
