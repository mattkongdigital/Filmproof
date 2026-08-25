import { SiloIndex } from '../../components/editorial';
import { siloMetadata } from '../../lib/posts';

export const generateMetadata = () => siloMetadata('guides');

export default function Page() {
  return <SiloIndex silo="guides" />;
}
