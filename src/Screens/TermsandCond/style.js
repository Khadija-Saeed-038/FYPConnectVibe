import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 4,
  },
  description: {
    marginHorizontal: 20,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
});

export default styles;
