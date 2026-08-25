import { PostArticle } from '../../../components/editorial';
import { postParams, postMetadata } from '../../../lib/posts';

export const generateStaticParams = () => postParams('guides');

export const generateMetadata = ({ params }) => postMetadata('guides', params.slug);

export default function Page({ params }) {
  return <PostArticle silo="guides" slug={params.slug} />;
}
