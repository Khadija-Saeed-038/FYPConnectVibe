import {StyleSheet} from 'react-native';
import {getThemeColor} from '../ThemeProvider/redux/saga';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 72,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    paddingBottom: 16,
    flexDirection: 'row',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    marginLeft: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  chatContainer: {
    marginHorizontal: 16,
    marginBottom: 4,
    marginTop: 8,
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  imageContainer: {
    width: 48,
    height: 48,
    marginHorizontal: 3,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgText: {
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'center',
  },
  image: {
    width: 48,
    height: 48,
    alignSelf: 'center',
    borderRadius: 24,
  },
  textContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '70%',
    borderRadius: 30,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  listFlex: {
    flex: 1,
    width: '100%',
  },
});

export default styles;
