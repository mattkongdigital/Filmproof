import { SiloIndex } from '../../components/editorial';
import { siloMetadata } from '../../lib/posts';

export const generateMetadata = () => siloMetadata('opinion');

export default function Page() {
  return <SiloIndex silo="opinion" />;
}
