-- Add quiz_choices column to checkpoints
alter table checkpoints add column if not exists quiz_choices text[];

-- Populate choices for each checkpoint
update checkpoints set quiz_choices = array['幸福商會', '自由商店', '光明堂', '黄金館'] where id = 1;
update checkpoints set quiz_choices = array['日本海海戦', 'レイテ沖海戦', '沖縄海戦', 'ミッドウェー海戦'] where id = 2;
update checkpoints set quiz_choices = array['相模灘', '東京湾', '浦賀水道', '駿河湾'] where id = 3;
update checkpoints set quiz_choices = array['富士山', '大山', '丹沢山', '筑波山'] where id = 4;
update checkpoints set quiz_choices = array['ヨット', '護衛艦', 'タンカー', '漁船'] where id = 5;
update checkpoints set quiz_choices = array['ウィリアム・アダムス', 'ジョン・セーリス', 'ヤン・ヨーステン', 'フランシス・ドレイク'] where id = 6;
