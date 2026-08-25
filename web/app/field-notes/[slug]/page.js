import { PostArticle } from '../../../components/editorial';
import { postParams, postMetadata } from '../../../lib/posts';

export const generateStaticParams = () => postParams('field-notes');

export const generateMetadata = ({ params }) => postMetadata('field-notes', params.slug);

export default function Page({ params }) {
  return <PostArticle silo="field-notes" slug={params.slug} />;
}
